import { Body, ConflictException, Controller, ForbiddenException, Get, Injectable,
  NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JwtGuard } from './auth';
import type { AuthRequest } from './auth';
import { Database, DbTransaction } from './database';
import { Prisma } from '@prisma/client';
import { CreateOrderDto, OrderItemDto, StatusDto } from './dto';
import { assertTransition, OrderStatus } from './order-state';
import { uuidParam } from './validation';

export interface ItemSnapshot {
  productId: string; productName: string; sizeId: string; sizeName: string;
  toppings: { id: string; name: string; price: number }[];
  quantity: number; unitPrice: number; lineTotal: number;
}
export interface OrderRecord {
  orderId: string; orderCode: string; userId: string; status: OrderStatus;
  totalAmount: number; items: ItemSnapshot[]; createdAt: Date; updatedAt: Date;
}
function orderRecord(order: { id: string; orderCode: string; userId: string; status: string;
  totalAmount: number; items: Prisma.JsonValue; createdAt: Date; updatedAt: Date }): OrderRecord {
  return { orderId: order.id, orderCode: order.orderCode, userId: order.userId,
    status: order.status as OrderStatus, totalAmount: order.totalAmount,
    items: order.items as unknown as ItemSnapshot[], createdAt: order.createdAt, updatedAt: order.updatedAt };
}

@Injectable()
export class OrdersService {
  constructor(private readonly db: Database) {}

  async snapshot(client: DbTransaction, item: OrderItemDto): Promise<ItemSnapshot> {
    const product = await client.product.findFirst({ where: { id: item.productId, isAvailable: true } });
    if (!product) throw new ConflictException({ code: 'PRODUCT_UNAVAILABLE', message: 'Product is unavailable' });
    const size = await client.productSize.findFirst({ where: {
      productId: product.id, ...(item.sizeId ? { id: item.sizeId } : { isDefault: true }),
    } });
    if (!size) throw new ConflictException({ code: 'INVALID_SIZE', message: 'Invalid product size' });
    const ids = item.toppingIds ?? [];
    const linked = ids.length ? await client.productTopping.findMany({
      where: { productId: product.id, toppingId: { in: ids }, topping: { isAvailable: true } },
      include: { topping: true },
    }) : [];
    if (linked.length !== ids.length) throw new ConflictException({ code: 'INVALID_TOPPING', message: 'Invalid or unavailable topping' });
    const toppings = linked.map(({ topping }) => ({ id: topping.id, name: topping.name, price: topping.price }))
      .sort((a, b) => a.id.localeCompare(b.id));
    const unitPrice = product.basePrice + size.priceDelta + toppings.reduce((sum, t) => sum + t.price, 0);
    const lineTotal = unitPrice * item.quantity;
    if (!Number.isSafeInteger(lineTotal) || unitPrice < 0 || lineTotal > 2147483647) {
      throw new ConflictException({ code: 'INVALID_CATALOG_PRICE', message: 'Invalid catalog price' });
    }
    return { productId: product.id, productName: product.name, sizeId: size.id,
      sizeName: size.name, toppings, quantity: item.quantity, unitPrice, lineTotal };
  }

  async stock(client: DbTransaction, items: ItemSnapshot[], reserve: boolean) {
    const quantities = new Map<string, number>();
    for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    // updateMany with a stock >= quantity predicate is atomic (prevents overselling).
    for (const [id, quantity] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
      const result = await client.product.updateMany({
        where: reserve ? { id, isAvailable: true, stock: { gte: quantity } } : { id },
        data: { stock: reserve ? { decrement: quantity } : { increment: quantity } },
      });
      if (result.count !== 1) throw new ConflictException({
        code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock or unavailable product',
      });
    }
  }

  async row(client: DbTransaction, id: string, userId?: string, _lock = false): Promise<OrderRecord> {
    // Serializable transactions and conditional updates protect concurrent state changes.
    const order = await client.order.findFirst({ where: { id, ...(userId ? { userId } : {}) } });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    return orderRecord(order);
  }

  async change(client: DbTransaction, order: OrderRecord, next: OrderStatus, actorId: string) {
    assertTransition(order.status, next);
    const updated = await client.order.updateMany({
      where: { id: order.orderId, status: order.status }, data: { status: next },
    });
    if (updated.count !== 1) throw new ConflictException({
      code: 'CONCURRENT_MODIFICATION', message: 'Order state was changed concurrently',
    });
    await client.orderStatusHistory.create({ data: { id: randomUUID(), orderId: order.orderId,
      fromStatus: order.status, toStatus: next, actorId } });
    order.status = next;
  }

  async create(userId: string, dto: CreateOrderDto) {
    return this.db.transaction(async client => {
      const items: ItemSnapshot[] = [];
      for (const item of dto.items) items.push(await this.snapshot(client, item));
      const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
      if (!Number.isSafeInteger(total) || total > 2147483647) throw new ConflictException({
        code: 'INVALID_ORDER_TOTAL', message: 'Order total is too large',
      });
      await this.stock(client, items, true);
      const id = randomUUID();
      await client.order.create({ data: { id, orderCode: `BL-${id.replace(/-/g, '').toUpperCase()}`,
        userId, totalAmount: total, items: items as unknown as Prisma.InputJsonValue } });
      await client.orderStatusHistory.create({ data: { id: randomUUID(), orderId: id,
        toStatus: 'PENDING', actorId: userId } });
      return this.row(client, id, userId);
    });
  }

  async list(userId: string) {
    const rows = await this.db.order.findMany({ where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
    return rows.map(orderRecord);
  }

  async detail(userId: string, id: string) {
    return this.db.transaction(async client => {
      const order = await this.row(client, id, userId);
      const history = await client.orderStatusHistory.findMany({ where: { orderId: id },
        orderBy: { sequence: 'asc' }, select: { fromStatus: true, toStatus: true,
          actorId: true, createdAt: true } });
      const payments = await client.payment.findMany({ where: { orderId: id },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: { id: true, paymentMethod: true, amount: true, status: true, createdAt: true } });
      return { ...order, history, payments: payments.map(({ id: paymentId, ...p }) => ({ paymentId, ...p })) };
    });
  }

  async cancel(userId: string, id: string) {
    return this.db.transaction(async client => {
      const order = await this.row(client, id, userId);
      assertTransition(order.status, 'CANCELLED');
      await this.stock(client, order.items, false);
      await this.change(client, order, 'CANCELLED', userId);
      return this.row(client, id, userId);
    });
  }

  async updateStatus(request: AuthRequest, id: string, dto: StatusDto) {
    if (request.user.role !== 'STAFF') throw new ForbiddenException({
      code: 'STAFF_REQUIRED', message: 'Staff access required',
    });
    return this.db.transaction(async client => {
      const order = await this.row(client, id);
      await this.change(client, order, dto.status, request.user.id);
      return this.row(client, id);
    });
  }
}

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) { return this.orders.create(req.user.id, dto); }
  @Get('me') list(@Req() req: AuthRequest) { return this.orders.list(req.user.id); }
  @Get(':id') detail(@Req() req: AuthRequest, @Param('id', uuidParam()) id: string) {
    return this.orders.detail(req.user.id, id);
  }
  @Patch(':id/cancel') cancel(@Req() req: AuthRequest, @Param('id', uuidParam()) id: string) {
    return this.orders.cancel(req.user.id, id);
  }
  @Patch(':id/status') updateStatus(@Req() req: AuthRequest, @Param('id', uuidParam()) id: string,
    @Body() dto: StatusDto) { return this.orders.updateStatus(req, id, dto); }
}
