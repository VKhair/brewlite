export type OrderItem = {
  productId: string;
  productName: string;
  sizeId: string;
  sizeName: string;
  toppings: { id: string; name: string; price: number }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};
export type Order = {
  orderId: string;
  orderCode: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  history?: { toStatus: string; createdAt: string }[];
  payments?: {
    paymentId: string;
    status: string;
    amount: number;
    paymentMethod: string;
  }[];
};
