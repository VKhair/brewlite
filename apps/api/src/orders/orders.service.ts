import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderInventoryService } from '../inventory/order-inventory.service';
import { VNPAY_CHECKOUT_TTL_MS } from '../payments/providers/vnpay.provider';
import { randomUUID } from 'node:crypto';
import type { AuthUser } from '../auth/auth.types';
import { CouponsService } from '../coupons/coupons.service';
import type { Order, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderLoyaltyService } from './order-loyalty.service';
import { assertTransition, type OrderStatus } from './order-state';
import type { ItemSnapshot, OrderRecord } from './order.types';
import type { CreateOrderDto, OrderItemDto, StatusDto } from './orders.dto';

type Client = Prisma.TransactionClient;
const id = () => randomUUID();
function orderView(order: Order): OrderRecord {
  return {
    orderId: order.id,
    orderCode: order.orderCode,
    userId: order.userId,
    status: order.status as OrderStatus,
    totalAmount: order.totalAmount,
    items: order.items as unknown as ItemSnapshot[],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly db: PrismaService,
    private readonly coupons: CouponsService,
    private readonly loyalty: OrderLoyaltyService,
    private readonly inventory: OrderInventoryService,
  ) {}

  async snapshot(client: Client, item: OrderItemDto): Promise<ItemSnapshot> {
    const product = await client.product.findFirst({
      where: { id: item.productId, isAvailable: true },
    });
    if (!product)
      throw new ConflictException({
        code: 'PRODUCT_UNAVAILABLE',
        message: 'Product is unavailable',
      });
    const size = await client.productSize.findFirst({
      where: {
        productId: product.id,
        ...(item.sizeId ? { id: item.sizeId } : { isDefault: true }),
      },
    });
    if (!size)
      throw new ConflictException({
        code: 'INVALID_SIZE',
        message: 'Invalid product size',
      });
    const wanted = item.toppingIds ?? [];
    const links = wanted.length
      ? await client.productTopping.findMany({
          where: { productId: product.id, toppingId: { in: wanted } },
          include: { topping: true },
        })
      : [];
    const toppings = links
      .filter((link) => link.topping.isAvailable)
      .map(({ topping }) => ({
        id: topping.id,
        name: topping.name,
        price: topping.price,
      }));
    if (toppings.length !== wanted.length)
      throw new ConflictException({
        code: 'INVALID_TOPPING',
        message: 'Invalid or unavailable topping',
      });
    const unitPrice =
      product.basePrice +
      size.priceDelta +
      toppings.reduce((sum, t) => sum + t.price, 0);
    const lineTotal = unitPrice * item.quantity;
    if (
      !Number.isSafeInteger(lineTotal) ||
      unitPrice < 0 ||
      lineTotal > 2147483647
    )
      throw new ConflictException({
        code: 'INVALID_CATALOG_PRICE',
        message: 'Invalid catalog price',
      });
    return {
      productId: product.id,
      productName: product.name,
      sizeId: size.id,
      sizeName: size.name,
      toppings,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
    };
  }

  async row(
    client: Client,
    orderId: string,
    userId?: string,
    lock = false,
  ): Promise<OrderRecord> {
    if (lock)
      await client.$queryRaw`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
    const order = await client.order.findFirst({
      where: { id: orderId, ...(userId ? { userId } : {}) },
    });
    if (!order)
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    return orderView(order);
  }

  async change(
    client: Client,
    order: OrderRecord,
    next: OrderStatus,
    actorId: string,
  ) {
    assertTransition(order.status, next);
    const changed = await client.order.updateMany({
      where: { id: order.orderId, status: order.status },
      data: { status: next, updatedAt: new Date() },
    });
    if (changed.count !== 1)
      throw new ConflictException({
        code: 'ORDER_STATE_CHANGED',
        message: 'Order was updated by another request',
      });
    await client.orderStatusHistory.create({
      data: {
        id: id(),
        orderId: order.orderId,
        fromStatus: order.status,
        toStatus: next,
        actorId,
      },
    });
    order.status = next;
  }

  async create(userId: string, dto: CreateOrderDto) {
    return this.db.$transaction(async (tx) => {
      const items: ItemSnapshot[] = [];
      for (const item of dto.items) items.push(await this.snapshot(tx, item));
      const subtotalAmount = items.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );
      if (!Number.isSafeInteger(subtotalAmount) || subtotalAmount > 2147483647)
        throw new ConflictException({
          code: 'INVALID_ORDER_TOTAL',
          message: 'Order total is too large',
        });
      const discount = dto.couponCode
        ? await this.coupons.calculateDiscount(
            tx,
            dto.couponCode,
            subtotalAmount,
          )
        : { code: null, amount: 0 };
      const pointsUsed = dto.pointsUsed
        ? await this.loyalty.redeem(
            tx,
            userId,
            dto.pointsUsed,
            subtotalAmount - discount.amount,
          )
        : 0;
      const pointsDiscount = pointsUsed * 1000;
      const totalAmount = Math.max(
        0,
        subtotalAmount - discount.amount - pointsDiscount,
      );
      const orderId = id();
      const orderCode = `BL-${orderId.replaceAll('-', '').toUpperCase()}`;
      const order = await tx.order.create({
        data: {
          id: orderId,
          orderCode,
          userId,
          status: 'PENDING',
          subtotalAmount,
          discountAmount: discount.amount,
          pointsUsed,
          pointsDiscount,
          couponCode: discount.code,
          totalAmount,
          items: items as unknown as Prisma.InputJsonValue,
        },
      });
      await tx.orderStatusHistory.create({
        data: { id: id(), orderId, toStatus: 'PENDING', actorId: userId },
      });
      if (pointsUsed)
        await this.loyalty.recordRedemption(tx, userId, orderId, pointsUsed);
      return orderView(order);
    });
  }

  async list(userId: string) {
    const rows = await this.db.order.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map(orderView);
  }
  async detail(userId: string, orderId: string) {
    const order = await this.db.order.findFirst({
      where: { id: orderId, userId },
      include: {
        history: { orderBy: { sequence: 'asc' } },
        payments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!order)
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found',
      });
    return {
      ...orderView(order),
      history: order.history.map((h) => ({
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        actorId: h.actorId,
        createdAt: h.createdAt,
      })),
      payments: order.payments.map((p) => ({
        paymentId: p.id,
        ...(p.paymentMethod === 'VNPAY' && p.status === 'PENDING' ? {
          idempotencyKey: p.idempotencyKey,
          expiresAt: new Date(p.createdAt.getTime() + VNPAY_CHECKOUT_TTL_MS),
        } : {}),
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      })),
    };
  }
  async cancel(userId: string, orderId: string) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const order = await this.row(tx, orderId, userId, true);
      const pending = await tx.payment.findFirst({
        where: { orderId, paymentMethod: 'VNPAY', status: 'PENDING' },
      });
      if (pending && Date.now() < pending.createdAt.getTime() + VNPAY_CHECKOUT_TTL_MS)
        throw new ConflictException({
          code: 'PAYMENT_PENDING',
          message: 'Đơn đang chờ VNPay xác nhận kết quả.',
        });
      assertTransition(order.status, 'CANCELLED');
      if (pending) {
        await this.inventory.reversePaymentConsumption(tx, pending.id);
        await tx.payment.update({
          where: { id: pending.id },
          data: {
            status: 'FAILED',
            response: {
              ...(pending.response as Prisma.JsonObject),
              checkoutUrl: null, paymentStatus: 'FAILED', status: 'CANCELLED',
              cartAction: 'KEEP', message: 'Đã hủy đơn sau khi liên kết VNPay hết hạn.',
            },
          },
        });
      }
      await this.loyalty.refund(tx, orderId, userId);
      await this.change(tx, order, 'CANCELLED', userId);
      return this.row(tx, orderId, userId);
    });
  }
  async updateStatus(user: AuthUser, orderId: string, dto: StatusDto) {
    if (!['STAFF', 'ADMIN'].includes(user.role))
      throw new ForbiddenException({
        code: 'STAFF_REQUIRED',
        message: 'Staff access required',
      });
    return this.db.$transaction(async (tx) => {
      const order = await this.row(tx, orderId, undefined, true);
      await this.change(tx, order, dto.status, user.id);
      const updated = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          history: { orderBy: { sequence: 'asc' } },
          payments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
        },
      });
      return {
        ...orderView(updated),
        history: updated.history.map((h) => ({
          fromStatus: h.fromStatus,
          toStatus: h.toStatus,
          actorId: h.actorId,
          createdAt: h.createdAt,
        })),
        payments: updated.payments.map((p) => ({
          paymentId: p.id,
          paymentMethod: p.paymentMethod,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
        })),
      };
    });
  }

  earnPoints(tx: Client, order: OrderRecord) {
    return this.loyalty.earn(tx, order);
  }
}
