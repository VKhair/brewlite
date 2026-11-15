"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, Order, money } from "../../lib/api";
import { useStore } from "../../lib/store";
import { PageHeading } from "../../components/ui";
type Payment = {
  orderId: string;
  status: string;
  paymentStatus: string;
  message: string;
  cartAction: "CLEAR" | "KEEP";
  checkoutUrl?: string;
};
export default function Checkout() {
  const { cart, total, session, ready, clear } = useStore(),
    router = useRouter();
  const [method, setMethod] = useState<"EWALLET" | "CARD" | "VNPAY">("EWALLET"),
    [failDemo, setFailDemo] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pendingOrder, setPendingOrder] = useState<string | null>(null);
  const inFlight = useRef(false);
  const key = useRef<string | null>(null);
  const vnpayEnabled = process.env.NEXT_PUBLIC_PAYMENT_MODE === "vnpay";
  useEffect(() => {
    if (ready && !session) router.replace("/login?next=%2Fcheckout");
  }, [ready, session, router]);
  async function checkout() {
    if (!session || !cart.length || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      let orderId = pendingOrder;
      if (!orderId) {
        const order = await api<Order>(
          "/orders",
          {
            method: "POST",
            body: JSON.stringify({
              items: cart.map((x) => ({
                productId: x.productId,
                sizeId: x.sizeId,
                quantity: x.quantity,
                toppingIds: x.toppingIds,
              })),
            }),
          },
          session.access_token,
        );
        orderId = order.orderId;
        setPendingOrder(orderId);
        key.current = null;
      }
      if (!key.current) key.current = crypto.randomUUID();
      const payment = await api<Payment>(
        "/payments",
        {
          method: "POST",
          headers: { "Idempotency-Key": key.current },
          body: JSON.stringify({
            orderId,
            paymentMethod: method,
            ...(method === "VNPAY"
              ? {}
              : { mockOutcome: failDemo ? "FAILURE" : "SUCCESS" }),
          }),
        },
        session.access_token,
      );
      if (payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }
      key.current = null;
      if (payment.paymentStatus === "SUCCESS") {
        clear();
        router.push(`/success/${orderId}`);
      } else {
        setError(
          `${payment.message} Bạn có thể thử lại hoặc xem đơn trong lịch sử.`,
        );
        setPendingOrder(orderId);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Không thể hoàn tất thanh toán.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
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
              onChange={() => {
                setMethod("EWALLET");
                key.current = null;
              }}
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
              onChange={() => {
                setMethod("CARD");
                key.current = null;
              }}
            />
          </label>
          {vnpayEnabled && (
            <label
              className={`payment-option ${method === "VNPAY" ? "selected" : ""}`}
            >
              <span className="payment-emoji">🏦</span>
              <span>
                <strong>VNPay Sandbox</strong>
                <small>Thanh toán thử nghiệm qua VNPay</small>
              </span>
              <input
                type="radio"
                name="payment"
                checked={method === "VNPAY"}
                onChange={() => {
                  setMethod("VNPAY");
                  key.current = null;
                }}
              />
            </label>
          )}
          <label className="demo-toggle">
            <input
              type="checkbox"
              checked={failDemo}
              onChange={(e) => {
                setFailDemo(e.target.checked);
                key.current = null;
              }}
            />{" "}
            Mô phỏng giao dịch thất bại (để kiểm thử)
          </label>
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
