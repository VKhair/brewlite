import { Body, ConflictException, Controller, Headers, HttpCode, Injectable, Post, Req, UseGuards } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { JwtGuard } from './auth';
import type { AuthRequest } from './auth';
import { Database } from './database';
import { PaymentDto } from './dto';
import { OrdersService } from './orders';
import { validationFailure } from './validation';

@Injectable()
export class PaymentsService {
  constructor(private readonly db: Database, private readonly orders: OrdersService) {}

  async pay(userId: string, key: string, dto: PaymentDto) {
    return this.db.transaction(async client => {
      // Serializable transaction plus unique (userId, idempotencyKey) protects duplicates.
      const previous = await client.payment.findUnique({
        where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
      });
      if (previous) {
        if (previous.orderId !== dto.orderId || previous.paymentMethod !== dto.paymentMethod || previous.mockOutcome !== dto.mockOutcome) {
          throw new ConflictException({ code: 'IDEMPOTENCY_CONFLICT', message: 'Idempotency-Key was used for a different payment request' });
        }
        return previous.response;
      }
      const order = await this.orders.row(client, dto.orderId, userId, true);
      if (order.status === 'PAYMENT_FAILED') {
        // Failed attempts release inventory; retry must validate and reserve it again.
        for (const item of order.items) {
          await this.orders.snapshot(client, { productId: item.productId, sizeId: item.sizeId,
            quantity: item.quantity, toppingIds: item.toppings.map(t => t.id) });
        }
        await this.orders.stock(client, order.items, true);
        await this.orders.change(client, order, 'PENDING', userId);
      }
      if (order.status !== 'PENDING') throw new ConflictException({ code: 'ORDER_NOT_PAYABLE', message: 'Order cannot be paid in its current state' });
      const success = dto.mockOutcome === 'SUCCESS';
      if (!success) await this.orders.stock(client, order.items, false);
      await this.orders.change(client, order, success ? 'PAID' : 'PAYMENT_FAILED', userId);
      const paymentId = randomUUID();
      const response = { paymentId, orderId: order.orderId, orderCode: order.orderCode,
        totalAmount: order.totalAmount, status: order.status, paymentStatus: success ? 'SUCCESS' : 'FAILED',
        cartAction: success ? 'CLEAR' : 'KEEP',
        message: success ? 'Đặt hàng thành công. Mời tới quầy lấy nước.' : 'Thanh toán thất bại. Vui lòng thử lại.' };
      await client.payment.create({ data: { id: paymentId, userId, orderId: order.orderId,
        idempotencyKey: key, paymentMethod: dto.paymentMethod, mockOutcome: dto.mockOutcome,
        amount: order.totalAmount, status: response.paymentStatus, response } });
      return response;
    });
  }
}

@Controller('payments')
@UseGuards(JwtGuard)
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post() @HttpCode(200)
  pay(@Req() req: AuthRequest, @Headers('idempotency-key') key: string, @Body() dto: PaymentDto) {
    if (typeof key !== 'string' || !isUUID(key, '4')) throw validationFailure([
      { field: 'headers.idempotency-key', messages: ['Idempotency-Key must be a UUID v4'] },
    ]);
    return this.payments.pay(req.user.id, key, dto);
  }
}
