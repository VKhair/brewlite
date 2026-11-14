
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  getCartSnapshot,
  getServerCartSnapshot,
  subscribeCart,
  parseCart,
  saveCart,
} from "../../lib/cart-store";

export default function CartPage() {
  const cartSnapshot = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot
  );

  const cart = parseCart(cartSnapshot);

  const updateQuantity = (index: number, amount: number) => {
    const newCart = [...cart];
    newCart[index].quantity += amount;

    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }

    saveCart(newCart);
  };

  const removeItem = (index: number) => {
    saveCart(cart.filter((_, i) => i !== index));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const totalQuantity = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "đ";

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#8b6b4a] transition hover:text-[#5f4631]"
          >
            <span>←</span>
            Tiếp tục mua hàng
          </Link>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a58a70]">
                Your selection
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#3d3027] sm:text-4xl">
                Giỏ hàng
              </h1>

              <p className="mt-2 text-sm text-[#897d72]">
                Những thức uống bạn đã lựa chọn.
              </p>
            </div>

            {cart.length > 0 && (
              <span className="rounded-full bg-[#eee5dc] px-4 py-2 text-sm font-medium text-[#795b40]">
                {totalQuantity} sản phẩm
              </span>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          /* Empty cart */
          <div className="rounded-3xl border border-[#eee7df] bg-white px-6 py-16 text-center shadow-sm sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f5eee7] text-3xl">
              ☕
            </div>

            <h2 className="mt-6 text-xl font-bold text-[#3d3027]">
              Giỏ hàng đang trống
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#897d72]">
              Có vẻ như bạn chưa chọn thức uống nào.
              Hãy khám phá menu và tìm món yêu thích nhé!
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-[#8b6b4a] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#705338]"
            >
              Khám phá menu
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
            {/* Cart items */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-[#3d3027]">
                  Sản phẩm đã chọn
                </h2>

                <span className="text-xs text-[#9a8d81]">
                  {cart.length} món
                </span>
              </div>

              <div className="space-y-4">
                {cart.map((item, index) => (
                  <article
                    key={`${item.productId}-${item.size}-${index}`}
                    className="flex gap-4 rounded-2xl border border-[#eee7df] bg-white p-3 shadow-sm transition hover:shadow-md sm:gap-5 sm:p-5"
                  >
                    {/* Product image */}
                    <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-[#eee5dc] sm:h-40 sm:w-32">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 96px, 128px"
                        className="object-cover"
                      />
                    </div>

                    {/* Product information */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-bold leading-snug text-[#3d3027] sm:text-lg">
                              {item.name}
                            </h3>

                            <p className="mt-2 text-xs text-[#897d72]">
                              Kích thước: {item.size}
                            </p>
                          </div>

                          <button
                            onClick={() => removeItem(index)}
                            aria-label={`Xóa ${item.name}`}
                            className="shrink-0 text-xs font-medium text-[#b47b6b] transition hover:text-red-600"
                          >
                            Xóa
                          </button>
                        </div>

                        {item.toppings?.length > 0 && (
                          <p className="mt-2 text-xs leading-5 text-[#897d72]">
                            Topping: {item.toppings.join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        {/* Quantity controls */}
                        <div className="flex items-center rounded-full border border-[#e9e0d7]">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            aria-label="Giảm số lượng"
                            className="flex h-8 w-9 items-center justify-center text-[#6e5946] transition hover:text-[#a17a53]"
                          >
                            −
                          </button>

                          <span className="min-w-7 text-center text-sm font-semibold text-[#3d3027]">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() => updateQuantity(index, 1)}
                            aria-label="Tăng số lượng"
                            className="flex h-8 w-9 items-center justify-center text-[#6e5946] transition hover:text-[#a17a53]"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-bold text-[#8b6b4a] sm:text-base">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Order summary */}
            <aside className="rounded-2xl border border-[#eee7df] bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
              <h2 className="text-lg font-bold text-[#3d3027]">
                Tóm tắt đơn hàng
              </h2>

              <p className="mt-1 text-xs text-[#9a8d81]">
                Kiểm tra lại thông tin đơn hàng của bạn.
              </p>

              <div className="my-5 border-t border-dashed border-[#e8ded4]" />

              <div className="flex justify-between text-sm text-[#766b60]">
                <span>Số lượng sản phẩm</span>
                <span className="font-medium text-[#3d3027]">
                  {totalQuantity}
                </span>
              </div>

              <div className="mt-4 flex justify-between text-sm text-[#766b60]">
                <span>Tạm tính</span>
                <span className="font-medium text-[#3d3027]">
                  {formatPrice(total)}
                </span>
              </div>

              <div className="mt-4 flex items-start justify-between gap-3 text-sm text-[#766b60]">
                <span>Phí vận chuyển</span>
                <span className="text-right text-xs text-[#9a8d81]">
                  Tính khi thanh toán
                </span>
              </div>

              <div className="my-5 border-t border-[#eee7df]" />

              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[#3d3027]">
                  Tổng cộng
                </span>

                <span className="text-xl font-bold text-[#8b6b4a]">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-7 block w-full rounded-full bg-[#8b6b4a] py-3.5 text-center text-sm font-bold text-white shadow-sm transition hover:bg-[#705338] hover:shadow-md"
              >
                Tiến hành thanh toán →
              </Link>

              <div className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-[#9a8d81]">
                <span>♧</span>
                <span>Cảm ơn bạn đã chọn BrewLite</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
