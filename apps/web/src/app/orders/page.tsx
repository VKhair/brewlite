
"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  subscribeOrders,
  type Order,
} from "../../lib/orders-store";

const ORDERS_KEY = "brewLiteOrders";

function getOrdersSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORDERS_KEY);
}

function getServerSnapshot() {
  return null;
}

export default function OrdersPage() {
  const snapshot = useSyncExternalStore(
    subscribeOrders,
    getOrdersSnapshot,
    getServerSnapshot
  );

  const orders: Order[] = snapshot
    ? JSON.parse(snapshot)
    : [];

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "đ";

  const getStatus = (status: string) => {
    switch (status) {
      case "PAID":
        return {
          label: "Đã thanh toán",
          color: "bg-green-100 text-green-700",
        };
      case "PAYMENT_FAILED":
        return {
          label: "Thanh toán thất bại",
          color: "bg-red-100 text-red-700",
        };
      case "PENDING":
        return {
          label: "Chờ thanh toán",
          color: "bg-yellow-100 text-yellow-700",
        };
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          color: "bg-blue-100 text-blue-700",
        };
      case "PROCESSING":
        return {
          label: "Đang chuẩn bị",
          color: "bg-blue-100 text-blue-700",
        };
      case "SHIPPING":
        return {
          label: "Đang giao hàng",
          color: "bg-purple-100 text-purple-700",
        };
      case "DELIVERED":
        return {
          label: "Đã giao hàng",
          color: "bg-green-100 text-green-700",
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          color: "bg-gray-100 text-gray-600",
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-600",
        };
    }
  };

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-[#8b6b4a] hover:underline"
          >
            ← Quay lại trang chủ
          </Link>

          <h1 className="mt-5 text-3xl font-bold text-[#493523]">
            Đơn hàng của tôi
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Theo dõi và quản lý các đơn hàng bạn đã đặt tại BrewLite.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-5xl">☕</div>

            <h2 className="mt-5 text-xl font-bold text-[#493523]">
              Bạn chưa có đơn hàng nào
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Hãy chọn thức uống yêu thích và đặt hàng ngay nhé!
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-[#8b6b4a] px-7 py-3 font-semibold text-white hover:bg-[#705338]"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              Bạn có {orders.length} đơn hàng
            </p>

            {orders.map((order) => {
              const status = getStatus(order.status);

              return (
                <div
                  key={order.orderId}
                  className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs text-gray-400">
                        MÃ ĐƠN HÀNG
                      </p>

                      <p className="mt-1 font-bold text-[#493523]">
                        {order.orderId}
                      </p>

                      <p className="mt-2 text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="my-5 border-t border-[#eee5dc]" />

                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm text-gray-500">
                        {order.items.length} sản phẩm
                      </p>

                      <p className="mt-1 text-lg font-bold text-[#8b6b4a]">
                        {formatPrice(order.total)}
                      </p>
                    </div>

                    <Link
                      href={`/orders/${encodeURIComponent(order.orderId)}`}
                      className="rounded-full border border-[#8b6b4a] px-6 py-2.5 text-center text-sm font-semibold text-[#8b6b4a] transition hover:bg-[#8b6b4a] hover:text-white"
                    >
                      Xem chi tiết →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
