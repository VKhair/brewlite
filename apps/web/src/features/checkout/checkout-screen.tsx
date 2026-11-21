"use client";

import Link from "next/link";
import { money } from "@/shared/format";
import { PageHeading } from "@/shared/ui/page-heading";
import { useCheckout } from "./use-checkout";

export default function Checkout() {
  const {
    cart, total, session, ready, vnpayEnabled, method, selectPaymentMethod,
    failDemo, selectMockFailure, busy, error, pendingOrder, checkout,
  } = useCheckout();

  if (!ready || !session)
    return (
      <div className="container inner-page empty-state">
        Đang kiểm tra đăng nhập...
      </div>
    );
  if (!cart.length)
    return (
      <div className="container inner-page empty-state">
        <h2>Giỏ hàng trống</h2>
        <Link className="btn" href="/menu">
          Chọn đồ uống
        </Link>
      </div>
    );
  return (
    <div className="container inner-page">
      <PageHeading
        eyebrow="THANH TOÁN"
        title="Chỉ còn một bước nữa thôi!"
        description="Chọn phương thức thanh toán và hoàn tất đơn hàng của bạn."
      />
      <div className="cart-layout">
        <div className="panel">
          <h2>Phương thức thanh toán</h2>
          {vnpayEnabled ? (
            <div className="payment-option selected">
              <span className="payment-emoji">🏦</span>
              <span>
                <strong>VNPay Sandbox</strong>
                <small>Chọn nguồn tiền trên trang thanh toán VNPay</small>
              </span>
            </div>
          ) : (
            <>
              <p className="muted">
                Đây là thanh toán <strong>giả lập</strong> phục vụ bài tập lớn,
                không thu tiền thật.
              </p>
              <label
                className={`payment-option ${method === "EWALLET" ? "selected" : ""}`}
              >
                <span className="payment-emoji">📱</span>
                <span>
                  <strong>Ví điện tử</strong>
                  <small>Thanh toán nhanh qua ví (mô phỏng)</small>
                </span>
                <input
                  type="radio"
                  name="payment"
                  checked={method === "EWALLET"}
                  onChange={() => selectPaymentMethod("EWALLET")}
                />
              </label>
              <label
                className={`payment-option ${method === "CARD" ? "selected" : ""}`}
              >
                <span className="payment-emoji">💳</span>
                <span>
                  <strong>Thẻ ngân hàng</strong>
                  <small>Thanh toán bằng thẻ (mô phỏng)</small>
                </span>
                <input
                  type="radio"
                  name="payment"
                  checked={method === "CARD"}
                  onChange={() => selectPaymentMethod("CARD")}
                />
              </label>
              <label className="demo-toggle">
                <input
                  type="checkbox"
                  checked={failDemo}
                  onChange={(e) => selectMockFailure(e.target.checked)}
                />{" "}
                Mô phỏng giao dịch thất bại (để kiểm thử)
              </label>
            </>
          )}
          <div className="customer-box">
            <strong>👤 Thông tin khách hàng</strong>
            <p>
              {session.user.fullName} · {session.user.email}
            </p>
          </div>
          {pendingOrder && (
            <div className="info-box">
              Đơn đã được tạo. Nếu cần, bạn có thể{" "}
              <Link href={`/orders/${pendingOrder}`}>xem đơn hiện tại</Link>.
              Nhấn thanh toán để thử lại.
            </div>
          )}
          {error && (
            <div role="alert" className="error-box">
              {error}
            </div>
          )}
        </div>
        <div className="panel summary">
          <h2>Tóm tắt đơn hàng</h2>
          {cart.map((x) => (
            <div className="summary-line" key={x.key}>
              <span>
                {x.quantity} × {x.name} ({x.sizeName})
              </span>
              <strong>{money(x.unitPrice * x.quantity)}</strong>
            </div>
          ))}
          <hr />
          <div className="summary-total">
            <span>Tổng thanh toán</span>
            <strong>{money(total)}</strong>
          </div>
          <button disabled={busy} onClick={checkout} className="btn btn-block">
            {busy ? "Đang xử lý..." : `Xác nhận thanh toán · ${money(total)} ↗`}
          </button>
          <p className="summary-note">
            🔒 Mọi giao dịch chỉ được mô phỏng trên hệ thống demo.
          </p>
          <Link href="/cart" className="text-link">
            ← Quay về giỏ hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
