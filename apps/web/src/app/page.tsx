'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Product } from '../types';
import { fetchProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => {
        setError(err.message || 'Không thể tải danh sách sản phẩm');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Danh mục đồ uống
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)));
    return ['Tất cả', ...list];
  }, [products]);

  // Bộ lọc tìm kiếm và danh mục
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat =
        selectedCategory === 'Tất cả' || p.category === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

  const showToast = (productName: string) => {
    setToastMessage(`Đã thêm "${productName}" vào giỏ hàng!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-xl dark:bg-white dark:text-zinc-900 animate-slide-down">
          <svg className="h-5 w-5 text-emerald-400 dark:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-900 via-amber-800 to-amber-700 p-6 text-white shadow-lg mb-8">
        <div className="relative z-10 max-w-md">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
            BrewLite • Coffee &amp; Tea
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Đặt đồ uống nhanh chóng, không dùng tiền mặt
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-amber-100/90 leading-relaxed">
            Thưởng thức cà phê sữa đá pha phin, trà trái cây thanh mát và freeze hảo hạng mỗi ngày.
          </p>
        </div>
        <div className="absolute -right-8 -bottom-10 h-48 w-48 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />
      </section>

      {/* Search & Category Filter Section */}
      <section className="mb-6 space-y-4">
        {/* Search Input (Debounced) */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-400">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm cà phê, trà đào, freeze..."
            className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content: 3 UI States */}
      <section>
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            title="Không tìm thấy món phù hợp"
            message={
              search
                ? `Không có kết quả nào cho từ khóa "${search}".`
                : 'Danh mục này hiện chưa có món khả dụng.'
            }
            actionText="Xem tất cả menu"
            onAction={() => {
              setSearch('');
              setSelectedCategory('Tất cả');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal Customize Size & Topping */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddedToast={showToast}
        />
      )}
    </div>
  );
}
