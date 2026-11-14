import { ConflictException } from '@nestjs/common';

export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'PAYMENT_FAILED' | 'CANCELLED';
const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'], PAYMENT_FAILED: ['PENDING'],
  PAID: ['PREPARING'], PREPARING: ['READY'], READY: ['COMPLETED'], COMPLETED: [], CANCELLED: [],
};
export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!transitions[from]?.includes(to)) throw new ConflictException({ code: 'INVALID_ORDER_TRANSITION', message: `Cannot transition ${from} to ${to}` });
}
