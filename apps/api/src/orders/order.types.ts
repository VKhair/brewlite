import type { OrderStatus } from './order-state';

export interface ItemSnapshot {
  productId: string;
  productName: string;
  sizeId: string;
  sizeName: string;
  toppings: { id: string; name: string; price: number }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}
export type OrderRecord = {
  orderId: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  items: ItemSnapshot[];
  createdAt: Date;
  updatedAt: Date;
};
