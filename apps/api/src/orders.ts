import { Body, ConflictException, Controller, ForbiddenException, Get, Injectable, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JwtGuard } from './auth';
import type { AuthRequest } from './auth';
import { Prisma } from './generated/prisma/client';
import { CreateOrderDto, OrderItemDto, StatusDto } from './dto';
import { assertTransition, OrderStatus } from './order-state';
import { uuidParam } from './validation';
import { PrismaService } from './prisma/prisma.service';
import { CouponsService } from './coupons/coupons.service';
import { InventoryService } from './inventory/inventory.service';

export interface ItemSnapshot {
  productId: string; productName: string; sizeId: string; sizeName: string;
  toppings: { id: string; name: string; price: number }[];
  quantity: number; unitPrice: number; lineTotal: number;
}
export type OrderRecord = {
  orderId: string; orderCode: string; userId: string; status: OrderStatus; totalAmount: number;
  items: ItemSnapshot[]; createdAt: Date; updatedAt: Date;
};
type Client = Prisma.TransactionClient;
const id = () => randomUUID();
function orderView(order: any): OrderRecord {
  return { orderId: order.id, orderCode: order.orderCode, userId: order.userId, status: order.status,
    totalAmount: order.totalAmount, items: order.items as ItemSnapshot[], createdAt: order.createdAt, updatedAt: order.updatedAt };
}

@Injectable()
export class OrdersService {
  constructor(private readonly db: PrismaService, private readonly coupons: CouponsService, private readonly inventory: InventoryService) {}

  async snapshot(client: Client, item: OrderItemDto): Promise<ItemSnapshot> {
    const product = await client.product.findFirst({ where: { id: item.productId, isAvailable: true } });
    if (!product) throw new ConflictException({ code: 'PRODUCT_UNAVAILABLE', message: 'Product is unavailable' });
    const size = await client.productSize.findFirst({ where: { productId: product.id, ...(item.sizeId ? { id: item.sizeId } : { isDefault: true }) } });
    if (!size) throw new ConflictException({ code: 'INVALID_SIZE', message: 'Invalid product size' });
    const wanted = item.toppingIds ?? [];
    const links = wanted.length ? await client.productTopping.findMany({ where: { productId: product.id, toppingId: { in: wanted } }, include: { topping: true } }) : [];
    const toppings = links.filter(link => link.topping.isAvailable).map(({ topping }) => ({ id: topping.id, name: topping.name, price: topping.price }));
    if (toppings.length !== wanted.length) throw new ConflictException({ code: 'INVALID_TOPPING', message: 'Invalid or unavailable topping' });
    const unitPrice = product.basePrice + size.priceDelta + toppings.reduce((sum, t) => sum + t.price, 0);
    const lineTotal = unitPrice * item.quantity;
    if (!Number.isSafeInteger(lineTotal) || unitPrice < 0 || lineTotal > 2147483647) throw new ConflictException({ code: 'INVALID_CATALOG_PRICE', message: 'Invalid catalog price' });
    return { productId: product.id, productName: product.name, sizeId: size.id, sizeName: size.name, toppings, quantity: item.quantity, unitPrice, lineTotal };
  }

  async stock(client: Client, items: ItemSnapshot[], reserve: boolean) {
    const quantities = new Map<string, number>();
    for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    for (const [productId, quantity] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
      const changed = await client.product.updateMany({ where: { id: productId, isAvailable: true, stock: reserve ? { gte: quantity } : undefined }, data: { stock: { [reserve ? 'decrement' : 'increment']: quantity } } });
      if (!changed.count) throw new ConflictException({ code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock or unavailable product' });
    }
  }

  async row(client: Client, orderId: string, userId?: string, lock = false): Promise<OrderRecord> {
    if (lock) await client.$queryRaw`SELECT id FROM orders WHERE id = ${orderId}::uuid FOR UPDATE`;
    const order = await client.order.findFirst({ where: { id: orderId, ...(userId ? { userId } : {}) } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    return orderView(order);
  }

  async change(client: Client, order: OrderRecord, next: OrderStatus, actorId: string) {
    assertTransition(order.status, next);
    const changed = await client.order.updateMany({ where: { id: order.orderId, status: order.status }, data: { status: next, updatedAt: new Date() } });
    if (changed.count !== 1) throw new ConflictException({ code: 'ORDER_STATE_CHANGED', message: 'Order was updated by another request' });
    await client.orderStatusHistory.create({ data: { id: id(), orderId: order.orderId, fromStatus: order.status, toStatus: next, actorId } });
    order.status = next;
  }

  async create(userId: string, dto: CreateOrderDto) {
    return this.db.$transaction(async tx => {
      const items: ItemSnapshot[] = [];
      for (const item of dto.items) items.push(await this.snapshot(tx, item));
      const subtotalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
      if (!Number.isSafeInteger(subtotalAmount) || subtotalAmount > 2147483647) throw new ConflictException({ code: 'INVALID_ORDER_TOTAL', message: 'Order total is too large' });
      const discount = dto.couponCode ? await this.coupons.calculateDiscount(tx, dto.couponCode, subtotalAmount) : { code: null, amount: 0 };
      let pointsUsed = 0;
      if (dto.pointsUsed) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user || user.loyaltyPoints < dto.pointsUsed) throw new ConflictException({ code: 'INSUFFICIENT_POINTS', message: 'Not enough loyalty points' });
        pointsUsed = Math.min(dto.pointsUsed, Math.floor(Math.max(0, subtotalAmount - discount.amount) / 1000));
        if (pointsUsed) {
          const changed = await tx.user.updateMany({ where: { id: userId, loyaltyPoints: { gte: pointsUsed } }, data: { loyaltyPoints: { decrement: pointsUsed } } });
          if (!changed.count) throw new ConflictException({ code: 'INSUFFICIENT_POINTS', message: 'Not enough loyalty points' });
        }
      }
      const pointsDiscount = pointsUsed * 1000;
      const totalAmount = Math.max(0, subtotalAmount - discount.amount - pointsDiscount);
      await this.stock(tx, items, true);
      const orderId = id();
      const orderCode = `BL-${orderId.replaceAll('-', '').toUpperCase()}`;
      const order = await tx.order.create({ data: { id: orderId, orderCode, userId, status: 'PENDING',
        subtotalAmount, discountAmount: discount.amount, pointsUsed, pointsDiscount, couponCode: discount.code,
        totalAmount, items: items as unknown as Prisma.InputJsonValue } });
      await tx.orderStatusHistory.create({ data: { id: id(), orderId, toStatus: 'PENDING', actorId: userId } });
      if (pointsUsed) await tx.loyaltyTransaction.create({ data: { id: id(), userId, orderId, points: -pointsUsed, type: 'REDEEM' } });
      const requirements = await this.inventory.collectOrderRequirements(tx, items.map(item => ({ productId: item.productId,
        sizeName: item.sizeName, quantity: item.quantity, toppings: item.toppings })));
      await this.inventory.consume(tx, orderId, requirements);
      return orderView(order);
    });
  }

  async list(userId: string) {
    const rows = await this.db.order.findMany({ where: { userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
    return rows.map(orderView);
  }
  async detail(userId: string, orderId: string) {
    const order = await this.db.order.findFirst({ where: { id: orderId, userId }, include: {
      history: { orderBy: { sequence: 'asc' } }, payments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
    } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    return { ...orderView(order), history: order.history.map(h => ({ fromStatus: h.fromStatus, toStatus: h.toStatus, actorId: h.actorId, createdAt: h.createdAt })),
      payments: order.payments.map(p => ({ paymentId: p.id, paymentMethod: p.paymentMethod, amount: p.amount, status: p.status, createdAt: p.createdAt })) };
  }
  async cancel(userId: string, orderId: string) {
    return this.db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
      const order = await this.row(tx, orderId, userId, true);
      const pending = await tx.payment.findFirst({ where: { orderId, paymentMethod: 'VNPAY', status: 'PENDING' } });
      if (pending) throw new ConflictException({ code: 'PAYMENT_PENDING', message: 'Đơn đang chờ VNPay xác nhận kết quả.' });
      assertTransition(order.status, 'CANCELLED');
      await this.stock(tx, order.items, false);
      await this.inventory.reverseOrderConsumption(tx, orderId);
      await this.refundPoints(tx, orderId, userId, order.items);
      await this.change(tx, order, 'CANCELLED', userId);
      return this.row(tx, orderId, userId);
    });
  }
  private async refundPoints(tx: Client, orderId: string, userId: string, items: ItemSnapshot[]) {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { pointsUsed: true } });
    if (order?.pointsUsed) {
      const exists = await tx.loyaltyTransaction.findFirst({ where: { orderId, type: 'REFUND' } });
      if (!exists) {
        await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: { increment: order.pointsUsed } } });
        await tx.loyaltyTransaction.create({ data: { id: id(), userId, orderId, points: order.pointsUsed, type: 'REFUND' } });
      }
    }
    void items;
  }
  async updateStatus(request: AuthRequest, orderId: string, dto: StatusDto) {
    if (!['STAFF', 'ADMIN'].includes(request.user.role)) throw new ForbiddenException({ code: 'STAFF_REQUIRED', message: 'Staff access required' });
    return this.db.$transaction(async tx => {
      const order = await this.row(tx, orderId, undefined, true);
      await this.change(tx, order, dto.status, request.user.id);
      const updated = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: {
        history: { orderBy: { sequence: 'asc' } }, payments: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      } });
      return { ...orderView(updated), history: updated.history.map(h => ({ fromStatus: h.fromStatus, toStatus: h.toStatus, actorId: h.actorId, createdAt: h.createdAt })),
        payments: updated.payments.map(p => ({ paymentId: p.id, paymentMethod: p.paymentMethod, amount: p.amount, status: p.status, createdAt: p.createdAt })) };
    });
  }
  async earnPoints(tx: Client, order: OrderRecord) {
    const amount = Math.floor(order.totalAmount / 10000);
    if (!amount) return;
    const existing = await tx.loyaltyTransaction.findFirst({ where: { orderId: order.orderId, type: 'EARN' } });
    if (existing) return;
    await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: { increment: amount } } });
    await tx.loyaltyTransaction.create({ data: { id: id(), userId: order.userId, orderId: order.orderId, points: amount, type: 'EARN' } });
    await tx.order.update({ where: { id: order.orderId }, data: { pointsEarned: amount } });
  }
}

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) { return this.orders.create(req.user.id, dto); }
  @Get('me') list(@Req() req: AuthRequest) { return this.orders.list(req.user.id); }
  @Get(':id') detail(@Req() req: AuthRequest, @Param('id', uuidParam()) id: string) { return this.orders.detail(req.user.id, id); }
  @Patch(':id/cancel') cancel(@Req() req: AuthRequest, @Param('id', uuidParam()) id: string) { return this.orders.cancel(req.user.id, id); }
  @Patch(':id/status') updateStatus(@Req() req: AuthRequest, @Param('id', uuidParam()) id: string, @Body() dto: StatusDto) { return this.orders.updateStatus(req, id, dto); }
}
