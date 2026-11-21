"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/app/app-providers";
import { PageHeading } from "@/shared/ui/page-heading";
export default function Account() {
  const { session, ready, signout } = useAppStore(),
    router = useRouter();
  useEffect(() => {
    if (ready && !session) router.replace("/login");
  }, [ready, session, router]);
  return (
    <div className="container inner-page">
      <PageHeading
        eyebrow="TÀI KHOẢN CỦA TÔI"
        title="Xin chào, bạn yêu cà phê!"
        description="Quản lý thông tin và các đơn hàng của bạn."
      />
      {session ? (
        <div className="account-panel panel">
          <div className="avatar">
            {session.user.fullName.charAt(0).toUpperCase()}
          </div>
          <h2>{session.user.fullName}</h2>
          <p>{session.user.email}</p>
          <div className="account-shortcuts">
            <Link href="/orders">
              📋 Đơn hàng của tôi <span>→</span>
            </Link>
            <Link href="/menu">
              ☕ Khám phá thực đơn <span>→</span>
            </Link>
            <Link href="/cart">
              🛒 Giỏ hàng <span>→</span>
            </Link>
          </div>
          <button
            className="danger-btn"
            onClick={() => {
              signout();
              router.push("/");
            }}
          >
            Đăng xuất
          </button>
        </div>
      ) : (
        <div className="empty-state">Đang tải tài khoản...</div>
      )}
    </div>
  );
}
