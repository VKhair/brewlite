'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../components/ProductCard';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalAmount, totalCount } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Hãy khám phá menu thơm ngon và chọn ngay món đồ uống yêu thích nhé!
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 transition-all"
        >
          <span>Khám phá menu ngay</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Giỏ hàng của bạn
          </h1>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {totalCount} ly đồ uống
          </span>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
        >
          Xóa tất cả
        </button>
      </div>

      {/* Cart Items List */}
      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div
            key={item.cartItemId}
            className="flex items-start gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Drink Icon */}
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-zinc-800 dark:text-amber-400">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-bold text-zinc-900 truncate dark:text-zinc-100">
                  {item.productName}
                </h3>
                <button
                  onClick={() => removeItem(item.cartItemId)}
                  className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Options */}
              <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  Size {item.size.name}
                </span>
                {item.selectedToppings.map((t) => (
                  <span
                    key={t.id}
                    className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  >
                    +{t.name}
                  </span>
                ))}
              </div>

              {/* Quantity Stepper & Price */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-800/60">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-700 dark:text-zinc-200"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400">
                  {formatVND(item.lineTotal)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Box */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">
          Tóm tắt đơn hàng
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Tổng số lượng:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{totalCount} ly</span>
          </div>
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Tạm tính:</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {formatVND(totalAmount)}
            </span>
          </div>
          <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
            <span>Phí dịch vụ:</span>
            <span className="font-semibold text-emerald-600">Miễn phí</span>
          </div>
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-baseline">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Tổng thanh toán:
            </span>
            <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">
              {formatVND(totalAmount)}
            </span>
          </div>
        </div>

        <Link
          href="/checkout"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-4 text-base font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 active:scale-[0.99] transition-all"
        >
          <span>Tiến hành thanh toán</span>
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
