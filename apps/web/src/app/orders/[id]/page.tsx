'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { fetchOrderDetail, cancelOrder } from '../../../services/api';
import { Order } from '../../../types';
import OrderStepper from '../../../components/OrderStepper';
import { formatVND } from '../../../components/ProductCard';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const { token, isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    fetchOrderDetail(token, orderId)
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message || 'Không thể tải thông tin đơn hàng'))
      .finally(() => setLoading(false));
  }, [token, orderId]);

  useEffect(() => {
    if (token) {
      loadOrder();
    }
  }, [token, loadOrder]);

  const handleCancelOrder = async () => {
    if (!token || !order) return;
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    setCancelling(true);
    try {
      const updated = await cancelOrder(token, order.orderId);
      setOrder(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Vui lòng đăng nhập
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Bạn cần đăng nhập để theo dõi trạng thái đơn hàng.
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

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-600 border-t-transparent" />
        <span className="text-sm font-medium text-zinc-500">Đang tải tiến trình đơn hàng...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Không tìm thấy đơn</h3>
        <p className="mt-1 text-sm text-zinc-500">{error || 'Đơn hàng không tồn tại.'}</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  const isPaid = order.status === 'PAID';
  const isPending = order.status === 'PENDING';
  const isFailed = order.status === 'PAYMENT_FAILED';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Top Banner Notice */}
      {isPaid && (
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Thanh toán thành công
              </span>
              <h2 className="text-xl font-extrabold">Mời bạn tới quầy nhận đồ uống!</h2>
            </div>
          </div>
          <p className="mt-3 text-xs text-emerald-100/90 leading-relaxed">
            Hệ thống quầy BrewLite đã tiếp nhận đơn. Vui lòng xuất trình mã đơn hàng{' '}
            <strong className="text-white underline">{order.orderCode}</strong> khi nhận nước.
          </p>
        </div>
      )}

      {isFailed && (
        <div className="mb-6 rounded-3xl bg-red-600 p-6 text-white shadow-lg">
          <h2 className="text-lg font-bold">Thanh toán không thành công</h2>
          <p className="mt-1 text-xs text-red-100">
            Giao dịch thanh toán chưa thể hoàn tất. Giỏ hàng của bạn vẫn được bảo toàn.
          </p>
          <Link
            href="/checkout"
            className="mt-4 inline-block rounded-xl bg-white px-4 py-2 text-xs font-bold text-red-700 shadow-sm"
          >
            Thử thanh toán lại
          </Link>
        </div>
      )}

      {/* Main Order Card */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 mb-6">
        {/* Header with Order Code & Live Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-xs text-zinc-400">Mã tra cứu đơn</span>
            <div className="text-xl font-extrabold tracking-tight text-amber-900 dark:text-amber-200 font-mono">
              {order.orderCode}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                order.status === 'PAID' || order.status === 'READY' || order.status === 'COMPLETED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : order.status === 'PENDING' || order.status === 'PREPARING'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              {order.status}
            </span>
            <button
              onClick={loadOrder}
              title="Làm mới trạng thái"
              className="rounded-xl border border-zinc-200 p-1.5 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* 5-Step Order Stepper (Order State Machine) */}
        <div className="my-4">
          <OrderStepper status={order.status} />
        </div>

        {/* Order Items Breakdown */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
            Chi tiết đồ uống đã đặt
          </h4>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-3 flex justify-between items-start">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="block text-xs text-zinc-500 mt-0.5">
                    Size {item.sizeName}
                    {item.toppings && item.toppings.length > 0 &&
                      ` • Topping: ${item.toppings.map((t) => t.name).join(', ')}`}
                  </span>
                </div>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  {formatVND(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-4 flex justify-between items-baseline">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
              Tổng tiền thanh toán:
            </span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
              {formatVND(order.totalAmount)}
            </span>
          </div>
        </div>

        {/* Cancel Button (FR-15: only available if PENDING) */}
        {isPending && (
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Actions */}
      <div className="flex gap-3">
        <Link
          href="/"
          className="flex-1 rounded-2xl bg-zinc-100 py-3.5 text-center text-sm font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          Tiếp tục xem menu
        </Link>
        <Link
          href="/orders"
          className="flex-1 rounded-2xl bg-amber-600 py-3.5 text-center text-sm font-bold text-white shadow-md hover:bg-amber-700 transition-colors"
        >
          Lịch sử đơn hàng
        </Link>
      </div>
    </div>
  );
}
