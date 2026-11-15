'use client';

import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace('₫', 'đ');
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const isOutOfStock = !product.isAvailable || (product.stock !== undefined && product.stock <= 0);

  return (
    <div
      onClick={() => !isOutOfStock && onSelect(product)}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-200 ${
        isOutOfStock
          ? 'cursor-not-allowed opacity-60 border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50'
          : 'cursor-pointer border-zinc-200/80 bg-white hover:border-amber-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-amber-500/30'
      }`}
    >
      {/* Product Image & Badge */}
      <div className="relative flex h-44 w-full items-center justify-center bg-gradient-to-b from-amber-50/60 to-orange-50/40 p-4 dark:from-zinc-800/50 dark:to-zinc-900/50">
        <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-700/20 group-hover:scale-105 transition-transform">
          <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>

        {/* Category tag */}
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 shadow-sm backdrop-blur-sm dark:bg-zinc-900/90 dark:text-amber-200">
          {product.category}
        </span>

        {/* Out of stock overlay badge */}
        {isOutOfStock && (
          <span className="absolute top-3 right-3 rounded-full bg-red-600/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
            Hết hàng
          </span>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-zinc-900 line-clamp-1 dark:text-zinc-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
          {product.description || 'Đồ uống tươi ngon pha chế theo công thức chuẩn vị BrewLite.'}
        </p>

        {/* Price & Action */}
        <div className="mt-auto flex items-center justify-between pt-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Giá từ</span>
            <div className="text-base font-extrabold text-amber-700 dark:text-amber-400">
              {formatVND(product.basePrice)}
            </div>
          </div>

          <button
            disabled={isOutOfStock}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-colors ${
              isOutOfStock
                ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600'
                : 'bg-amber-600 text-white shadow-sm hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400'
            }`}
          >
            <span>Chọn</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
