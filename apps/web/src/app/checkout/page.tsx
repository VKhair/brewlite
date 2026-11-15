'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder, payOrder } from '../../services/api';
import { formatVND } from '../../components/ProductCard';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, totalCount, clearCart } = useCart();
  const { token, isAuthenticated } = useAuth();

  const [paymentMethod, setPaymentMethod] = useState<'EWALLET' | 'CARD'>('EWALLET');
  const [mockOutcome, setMockOutcome] = useState<'SUCCESS' | 'FAILURE'>('SUCCESS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Chưa có món nào để thanh toán
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Vui lòng thêm đồ uống vào giỏ hàng trước khi đặt hàng.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-2xl bg-amber-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-700"
        >
          Quay lại menu
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Tạo đơn hàng (Checkout) -> PENDING
      const orderPayload = items.map((i) => ({
        productId: i.productId,
        sizeId: i.size.id,
        toppingIds: i.selectedToppings.map((t) => t.id),
        quantity: i.quantity,
      }));

      const newOrder = await createOrder(token, orderPayload);

      // 2. Sinh Idempotency-Key UUID v4 chống trừ tiền trùng lặp (NFR-08)
      const idempotencyKey = crypto.randomUUID();

      // 3. Thực hiện thanh toán qua Cổng mô phỏng
      const paymentRes = await payOrder(
        token,
        idempotencyKey,
        newOrder.orderId,
        paymentMethod,
        mockOutcome
      );

      // 4. Nếu thành công -> Dọn sạch giỏ hàng (AC-08.2)
      if (paymentRes.paymentStatus === 'SUCCESS') {
        clearCart();
      }

      // 5. Chuyển hướng tới trang chi tiết theo dõi đơn hàng
      router.push(`/orders/${newOrder.orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xử lý đơn hàng');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mb-6">
        Xác nhận &amp; Thanh toán
      </h1>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Yêu cầu đăng nhập nếu chưa login */}
      {!isAuthenticated && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 flex items-center justify-between">
          <span>Bạn cần đăng nhập để hoàn tất đơn hàng và tích điểm thành viên.</span>
          <Link
            href="/login"
            className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
          >
            Đăng nhập ngay
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left Column: Payment Options */}
        <div className="md:col-span-3 space-y-6">
          {/* Method Selection */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Phương thức thanh toán không dùng tiền mặt
            </h2>
            <div className="space-y-3">
              <label
                className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'EWALLET'
                    ? 'border-amber-600 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/20'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'EWALLET'}
                    onChange={() => setPaymentMethod('EWALLET')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                      Ví điện tử mô phỏng
                    </span>
                    <span className="text-xs text-zinc-500">Momo, ZaloPay, ViettelPay</span>
                  </div>
                </div>
                <span className="text-xl">📱</span>
              </label>

              <label
                className={`flex items-center justify-between rounded-2xl border p-4 cursor-pointer transition-colors ${
                  paymentMethod === 'CARD'
                    ? 'border-amber-600 bg-amber-50/50 dark:border-amber-500 dark:bg-amber-950/20'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                      Thẻ ngân hàng (ATM / Visa)
                    </span>
                    <span className="text-xs text-zinc-500">Cổng thanh toán giả lập</span>
                  </div>
                </div>
                <span className="text-xl">💳</span>
              </label>
            </div>
          </div>

          {/* Grading / Test Mock Outcome Selector */}
          <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/40 p-5 dark:border-amber-900/60 dark:bg-amber-950/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Chế độ kiểm thử kết quả (Mock Gateway)
              </span>
              <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded font-mono">
                Assignment 2 Test
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
              Cho phép kiểm chứng 2 kịch bản: Thanh toán thành công (Happy path) hoặc Thất bại để bảo toàn giỏ hàng (Unhappy path).
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMockOutcome('SUCCESS')}
                className={`rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                  mockOutcome === 'SUCCESS'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                ✓ Thanh toán Thành công
              </button>
              <button
                type="button"
                onClick={() => setMockOutcome('FAILURE')}
                className={`rounded-xl py-2 px-3 text-xs font-bold transition-all ${
                  mockOutcome === 'FAILURE'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-white text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                ✗ Giả lập Thất bại
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sticky top-24">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Đơn hàng ({totalCount} ly)
            </h3>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-56 overflow-y-auto mb-4 text-xs">
              {items.map((i) => (
                <div key={i.cartItemId} className="py-2.5 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {i.quantity}x {i.productName}
                    </span>
                    <span className="block text-zinc-400">
                      Size {i.size.name}
                      {i.selectedToppings.length > 0 &&
                        ` • ${i.selectedToppings.map((t) => t.name).join(', ')}`}
                    </span>
                  </div>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatVND(i.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2 text-sm">
              <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                <span>Tổng cộng:</span>
                <span className="text-xl text-amber-700 dark:text-amber-400">
                  {formatVND(totalAmount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={loading || !isAuthenticated}
              onClick={handleCheckout}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-700 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xử lý thanh toán...</span>
                </>
              ) : (
                <span>Xác nhận &amp; Thanh toán</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
