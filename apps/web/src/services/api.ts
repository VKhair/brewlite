import { Product, ProductDetail, Order, User, AuthSession, PaymentResponse } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';


export const SEED_PRODUCTS: ProductDetail[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Cà phê sữa',
    description: 'Cà phê phin truyền thống thơm nồng kết hợp cùng sữa đặc béo ngậy.',
    basePrice: 29000,
    imageUrl: '/images/drink.svg',
    category: 'Cà phê',
    isAvailable: true,
    stock: 100,
    sizes: [
      { id: '11111111-0000-4000-8000-000000000001', name: 'S', priceDelta: -5000, isDefault: false },
      { id: '11111111-0000-4000-8000-000000000002', name: 'M', priceDelta: 0, isDefault: true },
      { id: '11111111-0000-4000-8000-000000000003', name: 'L', priceDelta: 10000, isDefault: false },
    ],
    toppings: [
      { id: '20000000-0000-4000-8000-000000000001', name: 'Thạch cà phê', price: 5000, isAvailable: true },
      { id: '20000000-0000-4000-8000-000000000002', name: 'Đào miếng', price: 10000, isAvailable: true },
      { id: '20000000-0000-4000-8000-000000000003', name: 'Kem phô mai', price: 10000, isAvailable: false },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    name: 'Trà đào',
    description: 'Trà thơm mát thanh ngọt kết hợp cùng những lát đào giòn ngon hảo hạng.',
    basePrice: 39000,
    imageUrl: '/images/drink.svg',
    category: 'Trà',
    isAvailable: true,
    stock: 100,
    sizes: [
      { id: '22222222-0000-4000-8000-000000000001', name: 'S', priceDelta: -5000, isDefault: false },
      { id: '22222222-0000-4000-8000-000000000002', name: 'M', priceDelta: 0, isDefault: true },
      { id: '22222222-0000-4000-8000-000000000003', name: 'L', priceDelta: 10000, isDefault: false },
    ],
    toppings: [
      { id: '20000000-0000-4000-8000-000000000001', name: 'Thạch cà phê', price: 5000, isAvailable: true },
      { id: '20000000-0000-4000-8000-000000000002', name: 'Đào miếng', price: 10000, isAvailable: true },
      { id: '20000000-0000-4000-8000-000000000003', name: 'Kem phô mai', price: 10000, isAvailable: false },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    name: 'Matcha Freeze',
    description: 'Matcha Nhật Bản xay đá mát lạnh cùng sữa tươi và lớp kem mịn màng.',
    basePrice: 49000,
    imageUrl: '/images/drink.svg',
    category: 'Freeze',
    isAvailable: true,
    stock: 80,
    sizes: [
      { id: '33333333-0000-4000-8000-000000000001', name: 'S', priceDelta: -5000, isDefault: false },
      { id: '33333333-0000-4000-8000-000000000002', name: 'M', priceDelta: 0, isDefault: true },
      { id: '33333333-0000-4000-8000-000000000003', name: 'L', priceDelta: 10000, isDefault: false },
    ],
    toppings: [
      { id: '20000000-0000-4000-8000-000000000001', name: 'Thạch cà phê', price: 5000, isAvailable: true },
      { id: '20000000-0000-4000-8000-000000000002', name: 'Đào miếng', price: 10000, isAvailable: true },
      { id: '20000000-0000-4000-8000-000000000003', name: 'Kem phô mai', price: 10000, isAvailable: false },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    name: 'Cacao đá',
    description: 'Cacao nguyên chất đậm đà cùng sữa đặc và đá xay.',
    basePrice: 35000,
    imageUrl: '/images/drink.svg',
    category: 'Cacao',
    isAvailable: false,
    stock: 0,
    sizes: [
      { id: '44444444-0000-4000-8000-000000000001', name: 'S', priceDelta: -5000, isDefault: false },
      { id: '44444444-0000-4000-8000-000000000002', name: 'M', priceDelta: 0, isDefault: true },
      { id: '44444444-0000-4000-8000-000000000003', name: 'L', priceDelta: 10000, isDefault: false },
    ],
    toppings: [],
  },
];

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/products`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API_ERROR');
    const data = await res.json();
    return data;
  } catch {
    // Trả về danh sách khả dụng từ seed data khi backend offline
    return SEED_PRODUCTS.filter((p) => p.isAvailable);
  }
}

export async function fetchProductDetail(id: string): Promise<ProductDetail> {
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('API_ERROR');
    return await res.json();
  } catch {
    const found = SEED_PRODUCTS.find((p) => p.id === id);
    if (!found) throw new Error('PRODUCT_NOT_FOUND');
    return found;
  }
}

export async function loginUser(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Thông tin đăng nhập không chính xác');
  }
  return res.json();
}

export async function registerUser(
  email: string,
  fullName: string,
  password: string,
  phone?: string
): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, fullName, password, phone: phone || undefined }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Đăng ký không thành công');
  }
  return res.json();
}

export async function createOrder(
  token: string,
  items: { productId: string; sizeId?: string; toppingIds?: string[]; quantity: number }[]
): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể tạo đơn hàng');
  }
  return res.json();
}

export async function fetchMyOrders(token: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE}/orders/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Không thể tải lịch sử đơn hàng');
  }
  return res.json();
}

export async function fetchOrderDetail(token: string, orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Không tìm thấy thông tin đơn hàng');
  }
  return res.json();
}

export async function cancelOrder(token: string, orderId: string): Promise<Order> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Không thể hủy đơn hàng');
  }
  return res.json();
}

export async function payOrder(
  token: string,
  idempotencyKey: string,
  orderId: string,
  paymentMethod: 'EWALLET' | 'CARD',
  mockOutcome: 'SUCCESS' | 'FAILURE'
): Promise<PaymentResponse> {
  const res = await fetch(`${API_BASE}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'idempotency-key': idempotencyKey,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId, paymentMethod, mockOutcome }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Giao dịch thanh toán thất bại');
  }
  return res.json();
}
