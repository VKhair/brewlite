import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client';
import type { PaymentDto } from './payments.dto';
import {
  VNPAY_CHECKOUT_TTL_MS,
  type VnpayProvider,
} from './providers/vnpay.provider';

import { OrderInventoryService } from '../inventory/order-inventory.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './providers/payment-provider';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly db: PrismaService,
    private readonly orders: OrdersService,
    private readonly inventory: OrderInventoryService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  private paymentResponse(payment: {
    createdAt: Date;
    status: string;
    paymentMethod: string;
    response: Prisma.JsonValue;
  }) {
    if (payment.paymentMethod !== 'VNPAY') return payment.response;
    const { checkoutUrl, ...response } = payment.response as Prisma.JsonObject;
    if (payment.status !== 'PENDING' || !checkoutUrl) return response;
    if (Date.now() < payment.createdAt.getTime() + VNPAY_CHECKOUT_TTL_MS)
      return payment.response;
    return {
      ...response,
      message: 'Liên kết đã hết hạn. BrewLite đang chờ VNPay xác nhận kết quả.',
    };
  }

  async pay(userId: string, key: string, dto: PaymentDto, ip = '127.0.0.1') {
    const mockOutcome =
      dto.paymentMethod === 'VNPAY' ? null : (dto.mockOutcome ?? 'SUCCESS');
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const previous = await tx.payment.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
      });
      if (previous) {
        if (
          previous.orderId !== dto.orderId ||
          previous.paymentMethod !== dto.paymentMethod ||
          previous.mockOutcome !== mockOutcome
        ) {
          throw new ConflictException({
            code: 'IDEMPOTENCY_CONFLICT',
            message: 'Idempotency-Key was used for a different payment request',
          });
        }
        return this.paymentResponse(previous);
      }
      const order = await this.orders.row(tx, dto.orderId, userId, true);
      if (dto.paymentMethod === 'VNPAY' && this.provider.mode !== 'vnpay') {
        throw new ConflictException({
          code: 'VNPAY_DISABLED',
          message: 'VNPay checkout is not enabled',
        });
      }
      if (this.provider.mode === 'vnpay' && dto.paymentMethod !== 'VNPAY') {
        throw new ConflictException({
          code: 'PAYMENT_METHOD_UNAVAILABLE',
          message: 'Phương thức thanh toán này hiện không khả dụng.',
        });
      }
      const pending = await tx.payment.findFirst({
        where: {
          orderId: order.orderId,
          paymentMethod: 'VNPAY',
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (pending) return this.paymentResponse(pending);
      if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED')
        throw new ConflictException({
          code: 'ORDER_NOT_PAYABLE',
          message: 'Order cannot be paid in its current state',
        });
      if (
        dto.paymentMethod === 'VNPAY' &&
        !/^[1-9]\d{0,11}$/.test(String(order.totalAmount * 100))
      ) {
        throw new ConflictException({
          code: 'VNPAY_INVALID_AMOUNT',
          message: 'Số tiền của đơn không hợp lệ để thanh toán qua VNPay.',
        });
      }
      if (order.status === 'PAYMENT_FAILED') {
        for (const item of order.items)
          await this.orders.snapshot(tx, {
            productId: item.productId,
            sizeId: item.sizeId,
            quantity: item.quantity,
            toppingIds: item.toppings.map((t) => t.id),
          });
        await this.orders.change(tx, order, 'PENDING', userId);
      }
      const required = await this.inventory.collectOrderRequirements(
        tx,
        order.items,
      );
      await this.inventory.reserve(tx, required);

      const paymentId = randomUUID();
      if (dto.paymentMethod === 'VNPAY') {
        const txnRef = paymentId.replaceAll('-', '').toUpperCase();
        const paymentUrl = (this.provider as VnpayProvider).checkout({
          orderCode: txnRef,
          amount: order.totalAmount,
          ip: ip.replace(/^::ffff:/, ''),
        });
        const response = {
          paymentId,
          orderId: order.orderId,
          orderCode: order.orderCode,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentStatus: 'PENDING',
          cartAction: 'KEEP',
          checkoutUrl: paymentUrl,
          message: 'Đang chuyển tới cổng thanh toán VNPay.',
        };
        await tx.payment.create({
          data: {
            id: paymentId,
            userId,
            orderId: order.orderId,
            idempotencyKey: key,
            paymentMethod: 'VNPAY',
            mockOutcome: null,
            amount: order.totalAmount,
            status: 'PENDING',
            response,
            providerTxnRef: txnRef,
            paymentUrl,
          },
        });
        await this.inventory.recordConsumption(
          tx,
          order.orderId,
          paymentId,
          required,
        );
        return response;
      }
      const result = await this.provider.charge({
        orderId: order.orderId,
        orderCode: order.orderCode,
        amount: order.totalAmount,
        currency: 'VND',
        outcome: mockOutcome ?? 'SUCCESS',
      });
      const success = result === 'SUCCESS';
      await this.orders.change(
        tx,
        order,
        success ? 'PAID' : 'PAYMENT_FAILED',
        userId,
      );
      if (success) await this.orders.earnPoints(tx, order);
      const response = {
        paymentId,
        orderId: order.orderId,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: success ? 'SUCCESS' : 'FAILED',
        cartAction: success ? 'CLEAR' : 'KEEP',
        message: success
          ? 'Đặt hàng thành công. Mời tới quầy lấy nước.'
          : 'Thanh toán thất bại. Vui lòng thử lại.',
      };
      await tx.payment.create({
        data: {
          id: paymentId,
          userId,
          orderId: order.orderId,
          idempotencyKey: key,
          paymentMethod: dto.paymentMethod,
          mockOutcome,
          amount: order.totalAmount,
          status: response.paymentStatus,
          response,
        },
      });
      await this.inventory.recordConsumption(
        tx,
        order.orderId,
        paymentId,
        required,
      );
      if (!success)
        await this.inventory.reversePaymentConsumption(tx, paymentId);
      return response;
    });
  }
}
