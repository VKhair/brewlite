import { Body, ConflictException, Controller, Headers, HttpCode, Inject, Injectable, Ip, Logger, Post, Req, UseGuards, Get, Query, Res } from '@nestjs/common';
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
import { VNPAY_CHECKOUT_TTL_MS, VnpayProvider } from './vnpay';
import { InventoryService } from './inventory/inventory.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly db: PrismaService, private readonly orders: OrdersService,
    private readonly inventory: InventoryService, @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider) {}

  private paymentResponse(payment: { createdAt: Date; status: string; paymentMethod: string; response: Prisma.JsonValue }) {
    if (payment.paymentMethod !== 'VNPAY') return payment.response;
    const { checkoutUrl, ...response } = payment.response as Prisma.JsonObject;
    if (payment.status !== 'PENDING' || !checkoutUrl) return response;
    if (Date.now() < payment.createdAt.getTime() + VNPAY_CHECKOUT_TTL_MS) return payment.response;
    return { ...response, message: 'Liên kết đã hết hạn. BrewLite đang chờ VNPay xác nhận kết quả.' };
  }

  async pay(userId: string, key: string, dto: PaymentDto, ip = '127.0.0.1') {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const previous = await tx.payment.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: key } } });
      if (previous) {
        if (previous.orderId !== dto.orderId || previous.paymentMethod !== dto.paymentMethod || previous.mockOutcome !== (dto.mockOutcome ?? null)) {
          throw new ConflictException({ code: 'IDEMPOTENCY_CONFLICT', message: 'Idempotency-Key was used for a different payment request' });
        }
        return this.paymentResponse(previous);
      }
      const order = await this.orders.row(tx, dto.orderId, userId, true);
      if (dto.paymentMethod === 'VNPAY' && this.provider.mode !== 'vnpay') {
        throw new ConflictException({ code: 'VNPAY_DISABLED', message: 'VNPay checkout is not enabled' });
      }
      if (this.provider.mode === 'vnpay' && dto.paymentMethod !== 'VNPAY') {
        throw new ConflictException({ code: 'PAYMENT_METHOD_UNAVAILABLE', message: 'Phương thức thanh toán này hiện không khả dụng.' });
      }
      const pending = await tx.payment.findFirst({ where: { orderId: order.orderId, paymentMethod: 'VNPAY', status: 'PENDING' }, orderBy: { createdAt: 'desc' } });
      if (pending) return this.paymentResponse(pending);
      if (order.status === 'PAYMENT_FAILED') {
        for (const item of order.items) await this.orders.snapshot(tx, { productId: item.productId, sizeId: item.sizeId, quantity: item.quantity, toppingIds: item.toppings.map(t => t.id) });
        await this.orders.stock(tx, order.items, true);
        await this.orders.change(tx, order, 'PENDING', userId);
        await this.inventory.consume(tx, order.orderId, await this.inventory.collectOrderRequirements(tx, order.items.map(item => ({ productId: item.productId, sizeName: item.sizeName, quantity: item.quantity, toppings: item.toppings }))));
      }
      if (order.status !== 'PENDING') throw new ConflictException({ code: 'ORDER_NOT_PAYABLE', message: 'Order cannot be paid in its current state' });
      const paymentId = randomUUID();
      if (dto.paymentMethod === 'VNPAY') {
        const txnRef = paymentId.replaceAll('-', '').toUpperCase();
        const amount = String(order.totalAmount * 100);
        if (!/^[1-9]\d{0,11}$/.test(amount)) throw new ConflictException({ code: 'VNPAY_INVALID_AMOUNT', message: 'Số tiền của đơn không hợp lệ để thanh toán qua VNPay.' });
        const paymentUrl = (this.provider as VnpayProvider).checkout({ orderCode: txnRef, amount: order.totalAmount, ip: ip.replace(/^::ffff:/, '') });
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

  private callback(query: Record<string, unknown>) {
    if (this.provider.mode !== 'vnpay') return { code: '99' } as const;
    const provider = this.provider as VnpayProvider;
    const { valid, params } = provider.verify(query);
    if (!valid || params.get('vnp_TmnCode') !== provider.tmnCode) return { code: '97' } as const;
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
    const payment = await this.db.payment.findUnique({ where: { providerTxnRef: callback.txnRef } });
    if (payment && this.matchesAmount(callback.amount, payment.amount)) return payment.orderId;
  }

  async settleVnpay(query: Record<string, unknown>) {
    const callback = this.callback(query);
    if (callback.code) return callback.code;
    const where = { providerTxnRef: callback.txnRef };
    return this.db.$transaction(async tx => {
      const owner = await tx.payment.findUnique({ where, select: { userId: true, orderId: true } });
      if (!owner) return '01';
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${owner.userId}::uuid FOR UPDATE`;
      const order = await this.orders.row(tx, owner.orderId, owner.userId, true);
      const payment = await tx.payment.findUniqueOrThrow({ where });
      if (!this.matchesAmount(callback.amount, payment.amount)) return '04';
      if (payment.status !== 'PENDING') return '02';
      if (order.status !== 'PENDING' || !/^\d{2}$/.test(callback.responseCode) || !/^\d{2}$/.test(callback.status)) return '99';
      const success = callback.responseCode === '00' && callback.status === '00';
      const failed = (callback.status === '02' && !['00', '07'].includes(callback.responseCode)) ||
        (callback.status === '01' && ['11', '24'].includes(callback.responseCode));
      if (!success && !failed) return '99';
      const status = success ? 'SUCCESS' : 'FAILED';
      const response = { ...(payment.response as Prisma.JsonObject), paymentStatus: status, status: success ? 'PAID' : 'PAYMENT_FAILED', cartAction: success ? 'CLEAR' : 'KEEP',
        message: success ? 'Thanh toán thành công.' : 'Thanh toán thất bại. Bạn có thể thử lại.' };
      await tx.payment.update({ where: { id: payment.id }, data: { status, response } });
      if (!success) {
        await this.orders.stock(tx, order.items, false);
        await this.inventory.reverseOrderConsumption(tx, order.orderId);
      }
      await this.orders.change(tx, order, success ? 'PAID' : 'PAYMENT_FAILED', payment.userId);
      if (success) await this.orders.earnPoints(tx, order);
      return '00';
    });
  }
}

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  constructor(private readonly payments: PaymentsService) {}
  @Post() @HttpCode(200) @UseGuards(JwtGuard)
  pay(@Req() req: AuthRequest, @Headers('idempotency-key') key: string, @Body() dto: PaymentDto, @Ip() ip: string) {
    if (typeof key !== 'string' || !isUUID(key, '4')) throw validationFailure([{ field: 'headers.idempotency-key', messages: ['Idempotency-Key must be a UUID v4'] }]);
    return this.payments.pay(req.user.id, key, dto, ip);
  }
  @Get('vnpay/ipn') @HttpCode(200)
  async ipn(@Query() query: Record<string, unknown>) {
    const messages = { '00': 'Confirm Success', '01': 'Order not found', '02': 'Order already confirmed', '04': 'Invalid amount', '97': 'Invalid signature', '99': 'Unknown error' };
    try {
      const code = await this.payments.settleVnpay(query);
      return { RspCode: code, Message: messages[code] };
    } catch {
      this.logger.error('VNPay IPN processing failed');
      return { RspCode: '99', Message: messages['99'] };
    }
  }
  @Get('vnpay/return')
  async returnFromVnpay(@Query() query: Record<string, unknown>, @Res() res: Response) {
    const orderId = await this.payments.lookupVnpayReturn(query);
    const web = process.env.VNPAY_FRONTEND_URL || 'http://localhost:3002';
    return res.redirect(orderId ? `${web}/success/${orderId}` : `${web}/orders?payment=unverified`);
  }
}
