"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "./auth.api";
import { useAppStore } from "@/app/app-providers";
export default function Register() {
  const [fullName, setFullName] = useState(""),
    [email, setEmail] = useState(""),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [confirm, setConfirm] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { signin } = useAppStore(),
    router = useRouter();
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Mật khẩu nhập lại chưa khớp");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await register({
        fullName: fullName.trim(),
        email,
        phone: phone || undefined,
        password,
      });
      signin(result);
      router.replace("/account");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Đăng ký thất bại");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-art">
        <img
          className="auth-art-photo"
          src="/images/menu-10/tra-sua-thai-xanh.webp"
          alt=""
        />
        <h2>
          Gia nhập cộng đồng
          <br />
          yêu đồ uống!
        </h2>
        <p>Mỗi lần ghé BrewLite là một trải nghiệm vui.</p>
      </div>
      <div className="auth-box">
        <span className="eyebrow">BẮT ĐẦU CÙNG BREWLITE</span>
        <h1>Tạo tài khoản</h1>
        <p>Chỉ mất một phút để bắt đầu hành trình ngon lành.</p>
        <form onSubmit={submit} className="form">
          <label>
            Họ và tên
            <input
              required
              minLength={2}
              maxLength={50}
              autoComplete="name"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Số điện thoại <small>(không bắt buộc)</small>
            <input
              pattern="0[35789][0-9]{8}"
              title="Số điện thoại Việt Nam gồm 10 số"
              type="tel"
              placeholder="09xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label>
            Mật khẩu
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={6}
              maxLength={72}
              placeholder="Ít nhất 6 ký tự, gồm chữ và số"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            Nhập lại mật khẩu
            <input
              required
              type="password"
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          <button className="btn btn-block" disabled={busy}>
            {busy ? "Đang tạo tài khoản..." : "Tạo tài khoản ↗"}
          </button>
        </form>
        <p className="auth-switch">
          Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
