'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-900/10 bg-white/95 backdrop-blur-md dark:border-amber-100/10 dark:bg-zinc-900/95">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-amber-950 dark:text-amber-100">
              Brew<span className="text-amber-600">Lite</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-amber-800/60 dark:text-amber-400/60">
              Coffee &amp; Tea
            </span>
          </div>
        </Link>

        {/* Navigation links & actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              pathname === '/'
                ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Menu
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/orders"
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  pathname.startsWith('/orders')
                    ? 'bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                Đơn hàng
              </Link>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
              <span className="hidden sm:inline-block text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/60 px-2 py-1 rounded-full">
                {user?.fullName}
              </span>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Đăng nhập
            </Link>
          )}

          {/* Cart button with live badge */}
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-900/60 transition-colors"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-[11px] font-bold text-white shadow-sm animate-scale">
                {totalCount > 99 ? '99+' : totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
