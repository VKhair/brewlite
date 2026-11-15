
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession, type AuthSession } from "../../lib/auth";

const API_URL = "/api";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (fullName.trim().length < 2) {
      setError("Họ tên phải có ít nhất 2 ký tự.");
      return;
    }

    if (password.length < 6 || password.length > 72) {
      setError("Mật khẩu phải có từ 6 đến 72 ký tự.");
      return;
    }

    if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
      setError("Mật khẩu phải chứa ít nhất một chữ cái và một chữ số.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (phone && !/^0[35789]\d{8}$/.test(phone)) {
      setError("Số điện thoại không hợp lệ.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "EMAIL_ALREADY_REGISTERED") {
          throw new Error("Email này đã được đăng ký.");
        }

        throw new Error(
          data.message || "Đăng ký thất bại. Vui lòng thử lại."
        );
      }

      saveSession(data as AuthSession);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến máy chủ."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="auth-brand">
          <span className="brand-icon">☕</span>
          <span>Brew<span className="brand-light">Lite</span></span>
        </Link>

        <div className="auth-heading">
          <span className="eyebrow">WELCOME TO BREWLITE</span>
          <h1>Tạo tài khoản</h1>
          <p>Tham gia cùng BrewLite để tận hưởng những thức uống yêu thích.</p>
        </div>

        <form onSubmit={handleRegister} className="auth-form">
          <div className="auth-field">
            <label htmlFor="fullName">Họ và tên</label>
            <input
              id="fullName"
              type="text"
              placeholder="Nhập họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
              maxLength={50}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="phone">
              Số điện thoại <span>(Không bắt buộc)</span>
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Mật khẩu</label>
            <div className="auth-password">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Ít nhất 6 ký tự, gồm chữ và số"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                maxLength={72}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              maxLength={72}
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
        </form>

        <p className="auth-switch">
          Đã có tài khoản? <Link href="/login">Đăng nhập ngay</Link>
        </p>

        <Link href="/" className="auth-back">
          ← Quay lại thực đơn
        </Link>
      </div>
    </main>
  );
}
