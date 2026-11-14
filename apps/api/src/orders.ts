import { Body, ConflictException, Controller, ForbiddenException, Get, Injectable,
  NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuthRequest, JwtGuard } from './auth';
import { Database, Queryable } from './database';
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
const orderFields = `id AS "orderId", order_code AS "orderCode", user_id AS "userId", status,
  total_amount AS "totalAmount", items, created_at AS "createdAt", updated_at AS "updatedAt"`;

@Injectable()
export class OrdersService {
  constructor(private readonly db: Database) {}

  async snapshot(client: Queryable, item: OrderItemDto): Promise<ItemSnapshot> {
    const product = (await client.query('SELECT * FROM products WHERE id = $1 AND is_available = true', [item.productId])).rows[0];
    if (!product) throw new ConflictException({ code: 'PRODUCT_UNAVAILABLE', message: 'Product is unavailable' });
    const size = (await client.query(`SELECT * FROM product_sizes WHERE product_id = $1 AND
      ${item.sizeId ? 'id = $2' : 'is_default = true'}`, item.sizeId ? [item.productId, item.sizeId] : [item.productId])).rows[0];
    if (!size) throw new ConflictException({ code: 'INVALID_SIZE', message: 'Invalid product size' });
    const ids = item.toppingIds ?? [];
    const toppings = ids.length ? (await client.query(`SELECT t.id, t.name, t.price FROM toppings t
      JOIN product_toppings pt ON pt.topping_id = t.id
      WHERE pt.product_id = $1 AND t.id = ANY($2::uuid[]) AND t.is_available = true ORDER BY t.id`,
    [item.productId, ids])).rows : [];
    if (toppings.length !== ids.length) throw new ConflictException({ code: 'INVALID_TOPPING', message: 'Invalid or unavailable topping' });
    const unitPrice = product.base_price + size.price_delta + toppings.reduce((sum, t) => sum + t.price, 0);
    const lineTotal = unitPrice * item.quantity;
    if (!Number.isSafeInteger(lineTotal) || unitPrice < 0 || lineTotal > 2147483647) {
      throw new ConflictException({ code: 'INVALID_CATALOG_PRICE', message: 'Invalid catalog price' });
    }
    return { productId: product.id, productName: product.name, sizeId: size.id, sizeName: size.name,
      toppings: toppings as ItemSnapshot['toppings'], quantity: item.quantity, unitPrice, lineTotal };
  }

  async stock(client: Queryable, items: ItemSnapshot[], reserve: boolean) {
    const quantities = new Map<string, number>();
    for (const item of items) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
    // Consistent product ordering prevents deadlocks for overlapping multi-item carts.
    for (const [id, quantity] of [...quantities].sort(([a], [b]) => a.localeCompare(b))) {
      const result = await client.query(reserve
        ? `UPDATE products SET stock = stock - $2 WHERE id = $1 AND is_available = true AND stock >= $2 RETURNING id`
        : `UPDATE products SET stock = stock + $2 WHERE id = $1 RETURNING id`, [id, quantity]);
      if (!result.rows.length) throw new ConflictException({ code: 'INSUFFICIENT_STOCK', message: 'Insufficient stock or unavailable product' });
    }
  }

  async row(client: Queryable, id: string, userId?: string, lock = false): Promise<OrderRecord> {
    const result = await client.query(`SELECT ${orderFields} FROM orders WHERE id = $1
      ${userId ? 'AND user_id = $2' : ''} ${lock ? 'FOR UPDATE' : ''}`, userId ? [id, userId] : [id]);
    if (!result.rows[0]) throw new NotFoundException({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    return result.rows[0];
  }

  async change(client: Queryable, order: OrderRecord, next: OrderStatus, actorId: string) {
    assertTransition(order.status, next);
    await client.query('UPDATE orders SET status = $2, updated_at = clock_timestamp() WHERE id = $1', [order.orderId, next]);
    await client.query(`INSERT INTO order_status_history (id, order_id, from_status, to_status, actor_id)
      VALUES ($1, $2, $3, $4, $5)`, [randomUUID(), order.orderId, order.status, next, actorId]);
    order.status = next;
  }

  async create(userId: string, dto: CreateOrderDto) {
    return this.db.transaction(async client => {
      const items: ItemSnapshot[] = [];
      for (const item of dto.items) items.push(await this.snapshot(client, item));
      const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
      if (!Number.isSafeInteger(total) || total > 2147483647) throw new ConflictException({ code: 'INVALID_ORDER_TOTAL', message: 'Order total is too large' });
      await this.stock(client, items, true);
      const id = randomUUID();
      await client.query(`INSERT INTO orders (id, order_code, user_id, total_amount, items)
        VALUES ($1, $2, $3, $4, $5::jsonb)`, [id, `BL-${id.replace(/-/g, '').toUpperCase()}`, userId, total, JSON.stringify(items)]);
      await client.query(`INSERT INTO order_status_history (id, order_id, to_status, actor_id)
        VALUES ($1, $2, 'PENDING', $3)`, [randomUUID(), id, userId]);
      return this.row(client, id, userId);
    });
  }

  async list(userId: string) {
    return (await this.db.query(`SELECT ${orderFields} FROM orders WHERE user_id = $1 ORDER BY created_at DESC, id DESC`, [userId])).rows;
  }

  async detail(userId: string, id: string) {
    // One transaction gives a consistent order/history/payment snapshot.
    return this.db.transaction(async client => {
      const order = await this.row(client, id, userId, true);
      const history = (await client.query(`SELECT from_status AS "fromStatus", to_status AS "toStatus",
        actor_id AS "actorId", created_at AS "createdAt" FROM order_status_history
        WHERE order_id = $1 ORDER BY sequence`, [id])).rows;
      const payments = (await client.query(`SELECT id AS "paymentId", payment_method AS "paymentMethod", amount, status,
        created_at AS "createdAt" FROM payments WHERE order_id = $1 ORDER BY created_at, id`, [id])).rows;
      return { ...order, history, payments };
    });
  }

  async cancel(userId: string, id: string) {
    return this.db.transaction(async client => {
      const order = await this.row(client, id, userId, true);
      assertTransition(order.status, 'CANCELLED');
      await this.stock(client, order.items, false);
      await this.change(client, order, 'CANCELLED', userId);
      return this.row(client, id, userId);
    });
  }

  async updateStatus(request: AuthRequest, id: string, dto: StatusDto) {
    if (request.user.role !== 'STAFF') throw new ForbiddenException({ code: 'STAFF_REQUIRED', message: 'Staff access required' });
    return this.db.transaction(async client => {
      const order = await this.row(client, id, undefined, true);
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
