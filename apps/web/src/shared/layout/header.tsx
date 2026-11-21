"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAppStore } from "@/app/app-providers";

export function Header() {
  const { count, session, signout } = useAppStore();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = [
    ["/", "Trang chủ"],
    ["/menu", "Thực đơn"],
    ["/orders", "Đơn hàng"],
  ];
  return (
    <>
      <div className="topbar">
        ☕ Cà phê ngon, ngày thêm vui · Đặt trước và nhận tại quầy
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo" onClick={() => setOpen(false)}>
            <span className="logo-mark">B</span>
            <span>
              Brew<span className="orange">Lite</span>
              <small>COFFEE & MORE</small>
            </span>
          </Link>
          <nav className={open ? "desktop-nav open" : "desktop-nav"}>
            {nav.map(([href, title]) => (
              <Link
                key={href}
                onClick={() => setOpen(false)}
                className={path === href ? "active" : ""}
                href={href}
              >
                {title}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link href="/cart" className="cart-link" aria-label="Giỏ hàng">
              🛍️ <span className="cart-count">{count}</span>
            </Link>
            {session ? (
              <div className="account-nav">
                <Link href="/account" className="account-link">
                  👤{" "}
                  <span>{session.user.fullName.split(" ").slice(-1)[0]}</span>
                </Link>
                <button
                  onClick={() => {
                    signout();
                    router.push("/");
                  }}
                  className="logout-btn"
                  title="Đăng xuất"
                >
                  ↪
                </button>
              </div>
            ) : (
              <Link className="btn btn-small" href="/login">
                Đăng nhập
              </Link>
            )}
            <button
              className="menu-toggle"
              aria-label="Mở menu"
              onClick={() => setOpen((v) => !v)}
            >
              ☰
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
