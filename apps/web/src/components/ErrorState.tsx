import React from 'react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  message = 'Đã có lỗi xảy ra khi kết nối máy chủ.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200/80 bg-red-50/50 py-12 px-6 text-center shadow-sm dark:border-red-900/40 dark:bg-red-950/20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 mb-4">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-red-950 dark:text-red-200">Không thể tải dữ liệu</h3>
      <p className="mt-1 max-w-sm text-sm text-red-700/80 dark:text-red-300/80">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Thử lại
        </button>
      )}
    </div>
  );
}
