'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { fetchMyOrders } from '../../services/api';
import { Order } from '../../types';
import { formatVND } from '../../components/ProductCard';

export default function OrdersHistoryPage() {
  const { token, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchMyOrders(token)
      .then((data) => setOrders(data))
      .catch((err) => setError(err.message || 'Không thể tải lịch sử đơn'))
      .finally(() => setLoading(false));
  }, [token]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Vui lòng đăng nhập
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Bạn cần đăng nhập tài khoản để xem lịch sử các đơn hàng đã đặt.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-2xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-700"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
            Lịch sử đơn hàng
          </h1>
          <span className="text-xs text-zinc-500">
            Danh sách các đơn bạn đã đặt tại BrewLite
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
          <span className="text-xs text-zinc-400">Đang tải danh sách đơn hàng...</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Bạn chưa có đơn hàng nào
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Hãy chọn một ly đồ uống thơm ngon và đặt ngay bây giờ nhé!
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-amber-700"
          >
            Khám phá menu ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o.orderId}
              href={`/orders/${o.orderId}`}
              className="block rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm hover:border-amber-500/50 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span className="font-mono text-sm font-bold text-amber-900 dark:text-amber-200">
                  {o.orderCode}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    o.status === 'PAID' || o.status === 'READY' || o.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : o.status === 'PENDING' || o.status === 'PREPARING'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                  }`}
                >
                  {o.status}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>
                  {new Date(o.createdAt).toLocaleString('vi-VN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
                <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  {formatVND(o.totalAmount)}
                </span>
              </div>

              <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-1">
                {o.items?.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
