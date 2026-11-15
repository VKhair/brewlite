import { Body, ConflictException, Controller, Headers, HttpCode, Inject, Injectable, Post, Req, UseGuards, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { isUUID } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { JwtGuard } from './auth';
import type { AuthRequest } from './auth';
import { Prisma } from './generated/prisma/client';
import { PrismaService } from './prisma/prisma.service';
import { PaymentDto } from './dto';
import { OrdersService } from './orders';
import { validationFailure } from './validation';
import { PAYMENT_PROVIDER } from './payment-provider';
import type { PaymentProvider } from './payment-provider';
import { VnpayProvider } from './vnpay';
import { InventoryService } from './inventory/inventory.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly db: PrismaService, private readonly orders: OrdersService,
    private readonly inventory: InventoryService, @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  async pay(userId: string, key: string, dto: PaymentDto) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const previous = await tx.payment.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: key } } });
      if (previous) {
        if (previous.orderId !== dto.orderId || previous.paymentMethod !== dto.paymentMethod || previous.mockOutcome !== (dto.mockOutcome ?? null)) {
          throw new ConflictException({ code: 'IDEMPOTENCY_CONFLICT', message: 'Idempotency-Key was used for a different payment request' });
        }
        return previous.response;
      }
      const order = await this.orders.row(tx, dto.orderId, userId, true);
      if (dto.paymentMethod === 'VNPAY') {
        const pending = await tx.payment.findFirst({ where: { orderId: order.orderId, paymentMethod: 'VNPAY', status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
        if (pending) return pending.response;
      }
      if (order.status === 'PAYMENT_FAILED') {
        for (const item of order.items) await this.orders.snapshot(tx, { productId: item.productId, sizeId: item.sizeId, quantity: item.quantity, toppingIds: item.toppings.map(t => t.id) });
        await this.orders.stock(tx, order.items, true);
        await this.orders.change(tx, order, 'PENDING', userId);
        await this.inventory.consume(tx, order.orderId, await this.inventory.collectOrderRequirements(tx, order.items.map(item => ({ productId: item.productId, sizeName: item.sizeName, quantity: item.quantity, toppings: item.toppings }))));
      }
      if (order.status !== 'PENDING') throw new ConflictException({ code: 'ORDER_NOT_PAYABLE', message: 'Order cannot be paid in its current state' });
      const paymentId = randomUUID();
      if (dto.paymentMethod === 'VNPAY') {
        if (this.provider.mode !== 'vnpay') throw new ConflictException({ code: 'VNPAY_DISABLED', message: 'VNPay checkout is not enabled' });
        const txnRef = `${order.orderCode}-${paymentId.slice(0, 8).toUpperCase()}`;
        const paymentUrl = (this.provider as VnpayProvider).checkout({ orderCode: txnRef, amount: order.totalAmount, ip: '127.0.0.1' });
        const response = { paymentId, orderId: order.orderId, orderCode: order.orderCode, totalAmount: order.totalAmount,
          status: order.status, paymentStatus: 'PENDING', cartAction: 'KEEP', checkoutUrl: paymentUrl, message: 'Đang chuyển tới cổng thanh toán VNPay.' };
        await tx.payment.create({ data: { id: paymentId, userId, orderId: order.orderId, idempotencyKey: key,
          paymentMethod: 'VNPAY', mockOutcome: null, amount: order.totalAmount, status: 'PENDING', response,
          providerTxnRef: txnRef, paymentUrl } });
        return response;
      }
      const result = await this.provider.charge({ orderId: order.orderId, orderCode: order.orderCode,
        amount: order.totalAmount, currency: 'VND', outcome: dto.mockOutcome ?? 'SUCCESS' });
      const success = result === 'SUCCESS';
      if (!success) {
        await this.orders.stock(tx, order.items, false);
        await this.inventory.reverseOrderConsumption(tx, order.orderId);
      }
      await this.orders.change(tx, order, success ? 'PAID' : 'PAYMENT_FAILED', userId);
      if (success) await this.orders.earnPoints(tx, order);
      const response = { paymentId, orderId: order.orderId, orderCode: order.orderCode, totalAmount: order.totalAmount,
        status: order.status, paymentStatus: success ? 'SUCCESS' : 'FAILED', cartAction: success ? 'CLEAR' : 'KEEP',
        message: success ? 'Đặt hàng thành công. Mời tới quầy lấy nước.' : 'Thanh toán thất bại. Vui lòng thử lại.' };
      await tx.payment.create({ data: { id: paymentId, userId, orderId: order.orderId, idempotencyKey: key,
        paymentMethod: dto.paymentMethod, mockOutcome: dto.mockOutcome ?? 'SUCCESS', amount: order.totalAmount,
        status: response.paymentStatus, response } });
      return response;
    });
  }

  async settleVnpay(query: Record<string, unknown>) {
    if (this.provider.mode !== 'vnpay') return { ok: false, code: '99', orderId: undefined as string | undefined };
    const checked = (this.provider as VnpayProvider).verify(query);
    const val = (name: string) => checked.params.get(`vnp_${name}`) ?? '';
    if (!checked.valid) return { ok: false, code: '97', orderId: undefined as string | undefined };
    return this.db.$transaction(async tx => {
      const payment = await tx.payment.findUnique({ where: { providerTxnRef: val('TxnRef') } });
      if (!payment) return { ok: false, code: '01', orderId: undefined as string | undefined };
      await tx.$queryRaw`SELECT id FROM orders WHERE id = ${payment.orderId}::uuid FOR UPDATE`;
      if (payment.status !== 'PENDING') return { ok: payment.status === 'SUCCESS', code: payment.status === 'SUCCESS' ? '00' : '02', orderId: payment.orderId };
      const order = await this.orders.row(tx, payment.orderId);
      const success = Number(val('Amount')) === payment.amount * 100 && val('TmnCode') === (process.env.VNPAY_TMN_CODE ?? '') && val('ResponseCode') === '00' && val('TransactionStatus') === '00';
      const status = success ? 'SUCCESS' : 'FAILED';
      const response = { ...(payment.response as Prisma.JsonObject), paymentStatus: status, status: success ? 'PAID' : 'PAYMENT_FAILED', cartAction: success ? 'CLEAR' : 'KEEP' };
      await tx.payment.update({ where: { id: payment.id }, data: { status, response } });
      if (!success) {
        await this.orders.stock(tx, order.items, false);
        await this.inventory.reverseOrderConsumption(tx, order.orderId);
      }
      await this.orders.change(tx, order, success ? 'PAID' : 'PAYMENT_FAILED', payment.userId);
      if (success) await this.orders.earnPoints(tx, order);
      return { ok: success, code: '00', orderId: payment.orderId };
    });
  }
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post() @HttpCode(200) @UseGuards(JwtGuard)
  pay(@Req() req: AuthRequest, @Headers('idempotency-key') key: string, @Body() dto: PaymentDto) {
    if (typeof key !== 'string' || !isUUID(key, '4')) throw validationFailure([{ field: 'headers.idempotency-key', messages: ['Idempotency-Key must be a UUID v4'] }]);
    return this.payments.pay(req.user.id, key, dto);
  }
  @Get('vnpay/ipn') @HttpCode(200)
  async ipn(@Query() query: Record<string, unknown>) {
    const result = await this.payments.settleVnpay(query);
    return { RspCode: result.code, Message: result.code === '00' ? 'Confirm Success' : 'Confirm Failed' };
  }
  @Get('vnpay/return')
  async returnFromVnpay(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const result = await this.payments.settleVnpay(query);
    const web = process.env.VNPAY_FRONTEND_URL || 'http://localhost:3002';
    return res.redirect(result.ok && result.orderId ? `${web}/success/${result.orderId}` : `${web}/orders?payment=failed`);
  }
}
