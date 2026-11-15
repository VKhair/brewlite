
export interface Order {
  orderId: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    note?: string;
  };
  items: {
    productId: string;
    name: string;
    imageUrl: string;
    size: string;
    toppings: string[];
    quantity: number;
    unitPrice: number;
  }[];
  total: number;
  payment: string;
  status: string;
  createdAt: string;
}

const ORDERS_KEY = "brewLiteOrders";
const ORDERS_EVENT = "brewLiteOrdersChanged";

export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  const orders = getOrders();

  // Tránh lưu trùng đơn hàng
  const existingIndex = orders.findIndex(
    (item) => item.orderId === order.orderId
  );

  if (existingIndex >= 0) {
    orders[existingIndex] = order;
  } else {
    orders.unshift(order);
  }

  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  window.dispatchEvent(new Event(ORDERS_EVENT));
}

export function updateOrderStatus(
  orderId: string,
  status: string
) {
  const orders = getOrders();

  const updatedOrders = orders.map((order) =>
    order.orderId === orderId
      ? { ...order, status }
      : order
  );

  localStorage.setItem(
    ORDERS_KEY,
    JSON.stringify(updatedOrders)
  );

  window.dispatchEvent(new Event(ORDERS_EVENT));
}

export function getOrderById(orderId: string) {
  return getOrders().find(
    (order) => order.orderId === orderId
  ) ?? null;
}

export function subscribeOrders(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(ORDERS_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(ORDERS_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
