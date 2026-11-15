'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('customer@brewlite.vn');
    setPassword('Password123');
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white shadow-md shadow-amber-600/30">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Đăng nhập BrewLite
          </h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Chào mừng bạn quay lại! Đăng nhập để tiếp tục đặt hàng.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/40 flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Demo Fast Fill Button */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={fillDemoAccount}
            className="w-full rounded-xl border border-dashed border-amber-300 bg-amber-50/50 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100/60 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300 transition-colors"
          >
            Sử dụng tài khoản mẫu demo
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-bold text-amber-700 hover:underline dark:text-amber-400"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
