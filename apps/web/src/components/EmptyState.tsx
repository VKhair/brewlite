import React from 'react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'Không tìm thấy sản phẩm',
  message = 'Hiện chưa có sản phẩm nào phù hợp với tìm kiếm của bạn.',
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-12 px-6 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 mb-4">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
