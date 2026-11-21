import { api } from "@/shared/api/http-client";
import type { Order } from "./order.types";

type OrderLineInput = {
  productId: string;
  sizeId: string;
  quantity: number;
  toppingIds: string[];
};

export function createOrder(items: OrderLineInput[], token: string) {
  return api<Order>(
    "/orders",
    {
      method: "POST",
      body: JSON.stringify({ items }),
    },
    token,
  );
}

export function listOrders(token: string) {
  return api<Order[]>("/orders/me", {}, token);
}

export function getOrder(id: string, token: string, signal?: AbortSignal) {
  return api<Order>(`/orders/${id}`, signal ? { signal } : {}, token);
}

export function cancelOrder(id: string, token: string) {
  return api(`/orders/${id}/cancel`, { method: "PATCH" }, token);
}
