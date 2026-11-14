
"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

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
  window.addEventListener(ORDER_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(ORDER_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export default function OrderSuccessPage() {
  const orderSnapshot = useSyncExternalStore(
    subscribeOrder,
    getOrderSnapshot,
    getServerOrderSnapshot
  );

  let order = null;

  try {
    order = orderSnapshot ? JSON.parse(orderSnapshot) : null;
  } catch {
    order = null;
  }

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "đ";

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#3d3027]">
            Không tìm thấy đơn hàng
          </h1>
          <p className="mt-2 text-sm text-[#897d72]">
            Bạn chưa có đơn hàng nào được ghi nhận.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-full bg-[#8b6b4a] px-7 py-3 text-sm font-semibold text-white hover:bg-[#705338]"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Success message */}
        <section className="rounded-3xl border border-[#eee7df] bg-white px-5 py-10 text-center shadow-sm sm:px-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#edf4e9] text-4xl text-[#668b55]">
            ✓
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-[#a58a70]">
            BrewLite
          </p>

          <h1 className="mt-3 text-3xl font-bold text-[#3d3027]">
            Đặt hàng thành công!
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#897d72]">
            Cảm ơn bạn đã lựa chọn BrewLite. Đơn hàng của bạn đã được ghi nhận.
          </p>

          <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-[#faf6f1] p-4">
            <p className="text-xs text-[#897d72]">
              Mã đơn hàng
            </p>
            <p className="mt-1 text-lg font-bold tracking-wider text-[#8b6b4a]">
              {order.orderId}
            </p>
          </div>
        </section>

        {/* Customer information */}
        <section className="mt-6 rounded-2xl border border-[#eee7df] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-[#3d3027]">
            Thông tin nhận hàng
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#897d72]">Người nhận</span>
              <span className="text-right font-medium text-[#3d3027]">
                {order.customer.name}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-[#897d72]">Số điện thoại</span>
              <span className="text-right font-medium text-[#3d3027]">
                {order.customer.phone}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-[#897d72]">Địa chỉ</span>
              <span className="max-w-[65%] text-right font-medium text-[#3d3027]">
                {order.customer.address}
              </span>
            </div>

            {order.customer.note && (
              <div className="flex justify-between gap-4">
                <span className="text-[#897d72]">Ghi chú</span>
                <span className="max-w-[65%] text-right font-medium text-[#3d3027]">
                  {order.customer.note}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Ordered products */}
        <section className="mt-6 rounded-2xl border border-[#eee7df] bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-bold text-[#3d3027]">
            Chi tiết đơn hàng
          </h2>

          <div className="mt-5 space-y-4">
            {order.items.map((item: {
              productId: string;
              name: string;
              size: string;
              toppings: string[];
              quantity: number;
              unitPrice: number;
            }, index: number) => (
              <div
                key={`${item.productId}-${index}`}
                className="flex justify-between gap-4 border-b border-[#f0ebe5] pb-4 last:border-0"
              >
                <div>
                  <p className="text-sm font-semibold text-[#3d3027]">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs text-[#897d72]">
                    Size {item.size} · Số lượng: {item.quantity}
                  </p>
                  {item.toppings?.length > 0 && (
                    <p className="mt-1 text-xs text-[#897d72]">
                      Topping: {item.toppings.join(", ")}
                    </p>
                  )}
                </div>

                <p className="shrink-0 text-sm font-semibold text-[#8b6b4a]">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-[#eee7df] pt-5">
            <div className="flex justify-between text-sm text-[#897d72]">
              <span>Phương thức thanh toán</span>
              <span className="font-medium text-[#3d3027]">
                {order.payment === "cod"
                  ? "Thanh toán khi nhận hàng"
                  : "Chuyển khoản ngân hàng"}
              </span>
            </div>

            <div className="mt-4 flex justify-between gap-3">
              <span className="font-bold text-[#3d3027]">
                Tổng thanh toán
              </span>
              <span className="text-xl font-bold text-[#8b6b4a]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex-1 rounded-full bg-[#8b6b4a] px-6 py-3.5 text-center text-sm font-bold text-white transition hover:bg-[#705338]"
          >
            Tiếp tục mua hàng
          </Link>

          <Link
            href="/cart"
            className="flex-1 rounded-full border border-[#d9c9b8] px-6 py-3.5 text-center text-sm font-semibold text-[#795b40] transition hover:bg-[#f3ece4]"
          >
            Xem giỏ hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
