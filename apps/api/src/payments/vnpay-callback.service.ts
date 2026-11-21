import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import type { VnpayProvider } from './providers/vnpay.provider';

import { OrderInventoryService } from '../inventory/order-inventory.service';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './providers/payment-provider';

@Injectable()
export class VnpayCallbackService {
  constructor(
    private readonly db: PrismaService,
    private readonly orders: OrdersService,
    private readonly inventory: OrderInventoryService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  private callback(query: Record<string, unknown>) {
    if (this.provider.mode !== 'vnpay') return { code: '99' } as const;
    const provider = this.provider as VnpayProvider;
    const { valid, params } = provider.verify(query);
    if (!valid || params.get('vnp_TmnCode') !== provider.tmnCode)
      return { code: '97' } as const;
    const txnRef = params.get('vnp_TxnRef');
    if (!txnRef) return { code: '01' } as const;
    const amount = params.get('vnp_Amount') ?? '';
    const responseCode = params.get('vnp_ResponseCode') ?? '';
    const status = params.get('vnp_TransactionStatus') ?? '';
    return { txnRef, amount, responseCode, status } as const;
  }

  private matchesAmount(amount: string, expected: number) {
    return /^\d{1,12}$/.test(amount) && Number(amount) === expected * 100;
  }

  async lookupVnpayReturn(query: Record<string, unknown>) {
    const callback = this.callback(query);
    if (callback.code) return;
    const payment = await this.db.payment.findUnique({
      where: { providerTxnRef: callback.txnRef },
    });
    if (payment && this.matchesAmount(callback.amount, payment.amount))
      return payment.orderId;
  }

  async settleVnpay(query: Record<string, unknown>) {
    const callback = this.callback(query);
    if (callback.code) return callback.code;
    const where = { providerTxnRef: callback.txnRef };
    return this.db.$transaction(async (tx) => {
      const owner = await tx.payment.findUnique({
        where,
        select: { userId: true, orderId: true },
      });
      if (!owner) return '01';
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${owner.userId}::uuid FOR UPDATE`;
      const order = await this.orders.row(
        tx,
        owner.orderId,
        owner.userId,
        true,
      );
      const payment = await tx.payment.findUniqueOrThrow({ where });
      if (!this.matchesAmount(callback.amount, payment.amount)) return '04';
      if (order.status === 'CANCELLED' && payment.status === 'FAILED' &&
          callback.responseCode === '00' && callback.status === '00') {
        // The bank may confirm a charge after the customer cancelled an expired link.
        const response = payment.response as Prisma.JsonObject;
        if (!response.requiresRefundReview) {
          await tx.payment.update({ where: { id: payment.id }, data: {
            response: { ...response, requiresRefundReview: true },
          } });
          Logger.error('Late VNPay success requires refund review for payment ' + payment.id);
        }
        return '99';
      }
      if (payment.status !== 'PENDING') return '02';
      if (
        order.status !== 'PENDING' ||
        !/^\d{2}$/.test(callback.responseCode) ||
        !/^\d{2}$/.test(callback.status)
      )
        return '99';
      const success =
        callback.responseCode === '00' && callback.status === '00';
      const failed =
        (callback.status === '02' &&
          !['00', '07'].includes(callback.responseCode)) ||
        (callback.status === '01' &&
          ['11', '24'].includes(callback.responseCode));
      if (!success && !failed) return '99';
      const status = success ? 'SUCCESS' : 'FAILED';
      const response = {
        ...(payment.response as Prisma.JsonObject),
        paymentStatus: status,
        status: success ? 'PAID' : 'PAYMENT_FAILED',
        cartAction: success ? 'CLEAR' : 'KEEP',
        message: success
          ? 'Thanh toán thành công.'
          : 'Thanh toán thất bại. Bạn có thể thử lại.',
      };
      await tx.payment.update({
        where: { id: payment.id },
        data: { status, response },
      });
      if (!success)
        await this.inventory.reversePaymentConsumption(tx, payment.id);
      await this.orders.change(
        tx,
        order,
        success ? 'PAID' : 'PAYMENT_FAILED',
        payment.userId,
      );
      if (success) await this.orders.earnPoints(tx, order);
      return '00';
    });
  }
}
