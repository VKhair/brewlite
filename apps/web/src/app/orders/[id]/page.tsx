
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  subscribeOrders,
  type Order,
} from "../../../lib/orders-store";

const ORDERS_KEY = "brewLiteOrders";
const getProductImage = (productId: string, imageUrl?: string) => {
  const images: Record<string, string> = {
    "10000000-0000-4000-8000-000000000001": "/images/coffee-milk.jpg",
    "10000000-0000-4000-8000-000000000002": "/images/peach-tea.jpg",
    "10000000-0000-4000-8000-000000000003": "/images/matcha-freeze.jpg",
    "10000000-0000-4000-8000-000000000004": "/images/cacao-ice.jpg",
  };

  return images[productId] || imageUrl || "";
};
function getOrdersSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORDERS_KEY);
}

function getServerSnapshot() {
  return null;
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const snapshot = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getServerSnapshot
  );

  const orders: Order[] = snapshot
    ? JSON.parse(snapshot)
    : [];

  const order = orders.find(
    (item) => item.orderId.trim() === orderId.trim()
  );

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "đ";

  const getStatus = (status: string) => {
    switch (status) {
      case "PAID": return "Đã thanh toán";
      case "PAYMENT_FAILED": return "Thanh toán thất bại";
      case "PENDING": return "Chờ thanh toán";
      case "CONFIRMED": return "Đã xác nhận";
      case "PROCESSING": return "Đang chuẩn bị";
      case "SHIPPING": return "Đang giao hàng";
      case "DELIVERED": return "Đã giao hàng";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  };

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[#493523]">
            Không tìm thấy đơn hàng
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Đơn hàng không tồn tại hoặc chưa được lưu.
          </p>

          <Link
            href="/orders"
            className="mt-6 inline-block rounded-full bg-[#8b6b4a] px-6 py-3 text-white"
          >
            Quay lại đơn hàng
          </Link>
        </div>
      </main>
    );
  }

  // Giữ nguyên phần return hiển thị chi tiết đơn hàng bên dưới.

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-12">
      <div className="mx-auto max-w-4xl">

        <Link
          href="/orders"
          className="text-sm font-medium text-[#8b6b4a] hover:underline"
        >
          ← Quay lại đơn hàng
        </Link>

        <div className="mb-8 mt-6">
          <h1 className="text-3xl font-bold text-[#493523]">
            Chi tiết đơn hàng
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Mã đơn hàng: {order.orderId}
          </p>
        </div>

        <div className="space-y-6">

          {/* Order status */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#493523]">
              Trạng thái đơn hàng
            </h2>

            <p className="mt-3 inline-block rounded-full bg-[#f3eadf] px-4 py-2 text-sm font-semibold text-[#8b6b4a]">
              {getStatus(order.status)}
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Ngày đặt hàng:{" "}
              {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
          </section>

          {/* Products */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#493523]">
              Sản phẩm đã đặt
            </h2>

            <div className="space-y-5">
            {order.items.map((item, index) => {
            console.log("ORDER ITEM:", item.productId, item.imageUrl, item.name);

            return (
              <div
                  key={`${item.productId}-${index}`}
                  className="flex gap-4"
                >
                  <img
                    src={getProductImage(item.productId, item.imageUrl)}
                    alt={item.name}
                    className="h-24 w-24 rounded-xl bg-[#eee5dc] object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#493523]">
                      {item.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Size: {item.size}
                    </p>

                    {item.toppings.length > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        Topping: {item.toppings.join(", ")}
                      </p>
                    )}

                    <p className="mt-1 text-sm text-gray-500">
                      Số lượng: {item.quantity}
                    </p>

                    <p className="mt-2 font-semibold text-[#8b6b4a]">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
            );
          })}
            </div>

            <div className="mt-6 border-t border-[#eee5dc] pt-5">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-[#493523]">
                  Tổng thanh toán
                </span>

                <span className="text-[#8b6b4a]">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>

          {/* Customer information */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-[#493523]">
              Thông tin nhận hàng
            </h2>

            <div className="space-y-3 text-sm">
              <p>
                <span className="text-gray-500">Họ tên: </span>
                <strong>{order.customer.name}</strong>
              </p>

              <p>
                <span className="text-gray-500">Số điện thoại: </span>
                <strong>{order.customer.phone}</strong>
              </p>

              <p>
                <span className="text-gray-500">Địa chỉ: </span>
                <strong>{order.customer.address}</strong>
              </p>

              {order.customer.note && (
                <p>
                  <span className="text-gray-500">Ghi chú: </span>
                  <strong>{order.customer.note}</strong>
                </p>
              )}
            </div>
          </section>

          {/* Payment information */}
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#493523]">
              Thông tin thanh toán
            </h2>

            <p className="text-sm text-gray-600">
              Phương thức:{" "}
              <strong>{order.payment}</strong>
            </p>

            <p className="mt-3 text-sm text-gray-600">
              Trạng thái:{" "}
              <strong>{getStatus(order.status)}</strong>
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/orders"
              className="flex-1 rounded-full border border-[#8b6b4a] py-3 text-center font-semibold text-[#8b6b4a] hover:bg-[#f3eadf]"
            >
              Danh sách đơn hàng
            </Link>

            <Link
              href={`/orders/${encodeURIComponent(order.orderId)}/tracking`}
              className="flex-1 rounded-full bg-[#8b6b4a] py-3 text-center font-semibold text-white hover:bg-[#705338]"
            >
              Theo dõi đơn hàng →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
