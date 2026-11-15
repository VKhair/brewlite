"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { saveCart } from "../../lib/cart-store";
import { saveOrder, type Order } from "../../lib/orders-store";
import { getAccessToken } from "../../lib/auth";

const API_URL = "/api";

const ORDER_KEY = "brewLiteLastOrder";
const ORDER_EVENT = "brewLiteOrderChanged";

function getOrderSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ORDER_KEY);
}

function getServerOrderSnapshot() {
  return null;
}

function subscribeOrder(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(ORDER_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(ORDER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}



export default function PaymentPage() {
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");
  const orderSnapshot = useSyncExternalStore(
    subscribeOrder,
    getOrderSnapshot,
    getServerOrderSnapshot
  );

  const order: Order | null = orderSnapshot
    ? JSON.parse(orderSnapshot)
    : null;

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "đ";

  const updateOrderStatus = async (mockOutcome: "SUCCESS" | "FAILURE") => {
  if (!order || !order.orderId || isPaying) return;

  const token = getAccessToken();

  if (!token) {
    setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    return;
  }

  try {
    setIsPaying(true);
    setError("");

    const response = await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: JSON.stringify({
        orderId: order.orderId,
        paymentMethod: order.payment === "ewallet" ? "EWALLET" : "CARD",
        mockOutcome,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Thanh toán không thành công. Vui lòng thử lại."
      );
    }

    const updatedOrder = {
      ...order,
      status: data.status,
      paymentStatus: data.paymentStatus,
      total: data.totalAmount,
    };

    localStorage.setItem(ORDER_KEY, JSON.stringify(updatedOrder));
    saveOrder(updatedOrder);
    window.dispatchEvent(new Event(ORDER_EVENT));

    if (data.cartAction === "CLEAR" && data.paymentStatus === "SUCCESS") {
      saveCart([]);
      router.push("/order-success");
    }
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Đã xảy ra lỗi khi thanh toán."
    );
  } finally {
    setIsPaying(false);
  }
};
  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#493523]">
            Không tìm thấy đơn hàng
          </h1>
          <Link
            href="/cart"
            className="mt-5 inline-block rounded-full bg-[#8b6b4a] px-6 py-3 text-white"
          >
            Quay lại giỏ hàng
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a0805e]">
              BrewLite Payment
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#493523]">
              Thanh toán đơn hàng
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              Đây là cổng thanh toán mô phỏng phục vụ kiểm thử.
            </p>
          </div>

          <div className="mt-8 rounded-2xl bg-[#faf7f2] p-5">
            <div className="flex justify-between gap-3 text-sm">
              <span className="text-gray-500">Mã đơn hàng</span>
              <span className="font-semibold text-[#493523]">
                {order.orderId}
              </span>
            </div>

            <div className="mt-4 flex justify-between gap-3 text-sm">
              <span className="text-gray-500">Khách hàng</span>
              <span className="font-semibold text-[#493523]">
                {order.customer?.name}
              </span>
            </div>

            <div className="mt-4 flex justify-between gap-3 text-sm">
              <span className="text-gray-500">Phương thức</span>
              <span className="font-semibold text-[#493523]">
                {order.payment}
              </span>
            </div>

            <div className="mt-5 border-t border-[#e8ded2] pt-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#493523]">
                  Tổng thanh toán
                </span>
                <span className="text-xl font-bold text-[#8b6b4a]">
                  {formatPrice(order.total ?? 0)}
                </span>
              </div>
            </div>
          </div>

          {order.status === "PAYMENT_FAILED" && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Thanh toán thất bại. Đơn hàng chưa được thanh toán.
              Bạn có thể thử thanh toán lại.
            </div>
          )}

          {order.status === "PAID" ? (
            <div className="mt-6 rounded-xl bg-green-50 p-4 text-center text-green-700">
              Đơn hàng này đã được thanh toán thành công.
            </div>
          ) : (
            <div className="mt-7 space-y-3">
              <p className="text-center text-sm text-gray-500">
                Chọn kết quả để mô phỏng giao dịch:
              </p>

        <button
  type="button"
  disabled={isPaying}
  onClick={() => updateOrderStatus("SUCCESS")}
  className="w-full rounded-full bg-[#8b6b4a] py-3.5 font-semibold text-white transition hover:bg-[#705338] disabled:opacity-50"
>
  {isPaying ? "Đang xử lý..." : "Mô phỏng thanh toán thành công"}
</button>

<button
  type="button"
  disabled={isPaying}
  onClick={() => updateOrderStatus("FAILURE")}
  className="w-full rounded-full border border-red-300 py-3.5 font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
>
  {isPaying ? "Đang xử lý..." : "Mô phỏng thanh toán thất bại"}
</button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/cart"
              className="text-sm font-medium text-[#8b6b4a] hover:underline"
            >
              Quay lại giỏ hàng
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}