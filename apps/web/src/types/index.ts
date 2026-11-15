export interface Product {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  stock?: number;
}

export interface ProductSize {
  id: string;
  name: 'S' | 'M' | 'L';
  priceDelta: number;
  isDefault: boolean;
}

export interface Topping {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface ProductDetail extends Product {
  sizes: ProductSize[];
  toppings: Topping[];
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  basePrice: number;
  size: ProductSize;
  selectedToppings: Topping[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  sizeId: string;
  sizeName: string;
  toppings: { id: string; name: string; price: number }[];
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderStatusHistory {
  fromStatus?: string;
  toStatus: string;
  actorId: string;
  createdAt: string;
}

export interface PaymentRecord {
  paymentId: string;
  paymentMethod: 'EWALLET' | 'CARD';
  amount: number;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

export interface Order {
  orderId: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemSnapshot[];
  createdAt: string;
  updatedAt?: string;
  history?: OrderStatusHistory[];
  payments?: PaymentRecord[];
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'STAFF';
  phone?: string;
}

export interface AuthSession {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PaymentResponse {
  paymentId: string;
  orderId: string;
  orderCode: string;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: 'SUCCESS' | 'FAILED';
  cartAction: 'CLEAR' | 'KEEP';
  message: string;
}
