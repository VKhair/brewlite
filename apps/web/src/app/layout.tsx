import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import Navbar from '../components/Navbar';

export const metadata: Metadata = {
  title: 'BrewLite - Đặt cà phê không tiền mặt',
  description: 'BrewLite - Ứng dụng đặt và thanh toán đồ uống không dùng tiền mặt nhanh chóng, tiện lợi.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main className="flex-1 pb-16">{children}</main>
            <footer className="border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mx-auto max-w-5xl px-4">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                  BrewLite — Hệ thống đặt đồ uống trực tuyến không dùng tiền mặt
                </p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Đồ án Công nghệ Phần mềm • Next.js, NestJS, PostgreSQL &amp; Docker
                </p>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
