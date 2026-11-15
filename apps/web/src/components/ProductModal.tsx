'use client';

import React, { useEffect, useState } from 'react';
import { Product, ProductDetail, ProductSize, Topping } from '../types';
import { fetchProductDetail } from '../services/api';
import { formatVND } from './ProductCard';
import { useCart } from '../context/CartContext';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddedToast?: (name: string) => void;
}

export default function ProductModal({
  product,
  onClose,
  onAddedToast,
}: ProductModalProps) {
  const { addToCart } = useCart();
  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    let isMounted = true;
    setLoading(true);
    setQuantity(1);
    setSelectedToppings([]);

    fetchProductDetail(product.id)
      .then((data) => {
        if (!isMounted) return;
        setDetail(data);
        // Default size is size with isDefault: true, or Size M, or first size
        const defaultSize =
          data.sizes.find((s) => s.isDefault) ||
          data.sizes.find((s) => s.name === 'M') ||
          data.sizes[0] ||
          null;
        setSelectedSize(defaultSize);
      })
      .catch(() => {
        // Fallback minimal detail
        if (!isMounted) return;
        setDetail({
          ...product,
          sizes: [
            { id: 'size-s', name: 'S', priceDelta: -5000, isDefault: false },
            { id: 'size-m', name: 'M', priceDelta: 0, isDefault: true },
            { id: 'size-l', name: 'L', priceDelta: 10000, isDefault: false },
          ],
          toppings: [
            { id: 'top-1', name: 'Thạch cà phê', price: 5000, isAvailable: true },
            { id: 'top-2', name: 'Đào miếng', price: 10000, isAvailable: true },
          ],
        });
        setSelectedSize({ id: 'size-m', name: 'M', priceDelta: 0, isDefault: true });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [product]);

  if (!product) return null;

  const currentSizeDelta = selectedSize ? selectedSize.priceDelta : 0;
  const toppingsTotal = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const unitPrice = (product.basePrice || 0) + currentSizeDelta + toppingsTotal;
  const totalPrice = unitPrice * quantity;

  const toggleTopping = (topping: Topping) => {
    if (!topping.isAvailable) return;
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === topping.id);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id);
      }
      return [...prev, topping];
    });
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart({
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      basePrice: product.basePrice,
      size: selectedSize,
      selectedToppings,
      quantity,
    });
    if (onAddedToast) {
      onAddedToast(product.name);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="rounded-full bg-amber-100/80 px-2.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-950/80 dark:text-amber-200">
              {product.category}
            </span>
            <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {product.name}
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {product.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
            <span className="text-xs text-zinc-400">Đang tải tùy chọn món...</span>
          </div>
        ) : (
          <div className="py-4 space-y-6">
            {/* 1. Chọn Size (Radio Buttons) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Kích cỡ (Size)
                </span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">
                  Bắt buộc (chọn 1)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {detail?.sizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-bold shadow-sm dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                      }`}
                    >
                      <span className="text-sm">Size {size.name}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {size.priceDelta > 0
                          ? `+${formatVND(size.priceDelta)}`
                          : size.priceDelta < 0
                          ? `-${formatVND(Math.abs(size.priceDelta))}`
                          : '+0 đ'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Chọn Topping (Checkboxes) */}
            {detail?.toppings && detail.toppings.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Topping thêm
                  </span>
                  <span className="text-xs text-zinc-400">Tùy chọn</span>
                </div>
                <div className="space-y-2">
                  {detail.toppings.map((topping) => {
                    const isSelected = selectedToppings.some((t) => t.id === topping.id);
                    const isOutOfStock = !topping.isAvailable;
                    return (
                      <div
                        key={topping.id}
                        onClick={() => toggleTopping(topping)}
                        className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                          isOutOfStock
                            ? 'opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40'
                            : isSelected
                            ? 'cursor-pointer border-amber-600 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/30'
                            : 'cursor-pointer border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isOutOfStock}
                            onChange={() => {}}
                            className="h-4 w-4 rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span
                            className={`text-sm font-medium ${
                              isOutOfStock
                                ? 'text-zinc-400 line-through'
                                : 'text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            {topping.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOutOfStock ? (
                            <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-950/50 px-2 py-0.5 rounded">
                              Hết hàng
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                              +{formatVND(topping.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Số lượng (+ / - Stepper) */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Số lượng ly
              </span>
              <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                  </svg>
                </button>
                <span className="min-w-6 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-zinc-700 shadow-sm hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer with Total & CTA */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            disabled={loading || !selectedSize}
            onClick={handleAddToCart}
            className="flex w-full items-center justify-between rounded-2xl bg-amber-600 px-6 py-4 text-base font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            <span>Thêm vào giỏ hàng</span>
            <span className="rounded-lg bg-amber-700/60 px-3 py-1 text-sm font-extrabold">
              {formatVND(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
