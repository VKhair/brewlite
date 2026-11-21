"use client";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { login } from "./auth.api";
import { useAppStore } from "@/app/app-providers";
function LoginForm() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { signin } = useAppStore(),
    router = useRouter(),
    search = useSearchParams();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await login({ email, password });
      signin(result);
      const next = search.get("next");
      router.replace(
        next?.startsWith("/") && !next.startsWith("//") ? next : "/account",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng nhập thất bại");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-art">
        <img
          className="auth-art-photo"
          src="/images/menu-10/tra-sua-truyen-thong.webp"
          alt=""
        />
        <h2>
          Hương vị tuyệt vời
          <br />
          bắt đầu từ đây.
        </h2>
        <p>BrewLite — một ly ngon, một ngày vui.</p>
      </div>
      <div className="auth-box">
        <span className="eyebrow">CHÀO MỪNG TRỞ LẠI</span>
        <h1>Đăng nhập</h1>
        <p>Vui lòng nhập thông tin để tiếp tục đặt món.</p>
        <form onSubmit={submit} className="form">
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <div role="alert" className="error-box">
              {error}
            </div>
          )}
          <button disabled={busy} className="btn btn-block" type="submit">
            {busy ? "Đang đăng nhập..." : "Đăng nhập ↗"}
          </button>
        </form>
        <p className="auth-switch">
          Chưa có tài khoản? <Link href="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
export default function Login() {
  return (
    <Suspense
      fallback={<div className="container inner-page">Đang tải...</div>}
    >
      <LoginForm />
    </Suspense>
  );
}
