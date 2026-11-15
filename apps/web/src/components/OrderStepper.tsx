import React from 'react';
import { OrderStatus } from '../types';

interface OrderStepperProps {
  status: OrderStatus;
}

const STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: 'PENDING', label: 'Chờ thanh toán', desc: 'Đơn đã tạo' },
  { key: 'PAID', label: 'Đã thanh toán', desc: 'Xác nhận giao dịch' },
  { key: 'PREPARING', label: 'Đang pha chế', desc: 'Barista đang chuẩn bị' },
  { key: 'READY', label: 'Sẵn sàng', desc: 'Mời nhận đồ uống' },
  { key: 'COMPLETED', label: 'Hoàn tất', desc: 'Đã giao thành công' },
];

export default function OrderStepper({ status }: OrderStepperProps) {
  if (status === 'CANCELLED') {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Đơn hàng đã bị hủy (CANCELLED)
        </span>
      </div>
    );
  }

  if (status === 'PAYMENT_FAILED') {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900/40 dark:bg-red-950/20">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700 dark:bg-red-900/60 dark:text-red-300">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Thanh toán thất bại (PAYMENT_FAILED)
        </span>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress connecting line */}
        <div className="absolute top-4 left-0 h-1 w-full bg-zinc-200 dark:bg-zinc-800 -z-0" />
        <div
          className="absolute top-4 left-0 h-1 bg-amber-600 dark:bg-amber-500 transition-all duration-500 -z-0"
          style={{
            width: `${(Math.max(0, currentIndex) / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {/* 5 Step Nodes */}
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={step.key} className="flex flex-col items-center z-10">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isDone
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-zinc-950'
                    : isCurrent
                    ? 'bg-white text-amber-700 border-2 border-amber-600 ring-4 ring-amber-100 dark:bg-zinc-900 dark:text-amber-400 dark:border-amber-400 dark:ring-amber-950'
                    : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
                }`}
              >
                {isDone ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span
                className={`mt-2 text-[11px] font-semibold text-center whitespace-nowrap ${
                  isCurrent
                    ? 'text-amber-800 dark:text-amber-300 font-bold'
                    : isDone
                    ? 'text-zinc-700 dark:text-zinc-300'
                    : 'text-zinc-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
