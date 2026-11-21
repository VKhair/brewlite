"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { money, dateTime } from "@/shared/format";
import { payForOrder } from "@/features/payments/payments.api";
import type { MockPaymentMethod } from "@/features/payments/payment.types";
import { statusName } from "./order-status";
import { cancelOrder, getOrder } from "./orders.api";
import type { Order } from "./order.types";

import { useAppStore } from "@/app/app-providers";
import { PageHeading } from "@/shared/ui/page-heading";
import { OrderStatusBadge } from "@/features/orders/order-status-badge";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, session } = useAppStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [method, setMethod] = useState<MockPaymentMethod>("EWALLET");

  const token = session?.access_token;
  const vnpayEnabled = process.env.NEXT_PUBLIC_PAYMENT_MODE === "vnpay";
  const pendingVnpay = order?.payments?.some(
    (payment) =>
      payment.paymentMethod === "VNPAY" && payment.status === "PENDING",
  );

  // Tự động lấy thông tin đơn hàng
  useEffect(() => {
    if (!ready) return;

    if (!token) {
      router.replace("/login?next=%2Forders");
      return;
    }

    let active = true;

    const loadInitialOrder = async () => {
      try {
        const result = await getOrder(id, token);

        if (!active) return;

        setOrder(result);
        setError("");
      } catch (err) {
        if (!active) return;

        setError(errorMessage(err, "Không lấy được thông tin đơn"));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadInitialOrder();

    return () => {
      active = false;
    };
  }, [ready, token, id, router]);

  // Tải lại thông tin đơn hàng khi người dùng yêu cầu
  async function load() {
    if (!token) return;

    try {
      const result = await getOrder(id, token);
      setOrder(result);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Không lấy được thông tin đơn"));
    } finally {
      setLoading(false);
    }
  }

  async function refreshOrder() {
    setLoading(true);
    await load();
  }

  // Hủy đơn hàng
  async function cancel() {
    if (!token || !order) return;

    if (!window.confirm("Bạn muốn hủy đơn này?")) {
      return;
    }

    setBusy(true);

    try {
      await cancelOrder(id, token);

      await load();
    } catch (err) {
      setError(errorMessage(err, "Không thể hủy đơn"));
    } finally {
      setBusy(false);
    }
  }

  // Thanh toán lại
  async function pay() {
    if (!token || !order) return;

    setBusy(true);
    setError("");

    try {
      const result = await payForOrder({
        orderId: id,
        ...(vnpayEnabled
          ? { paymentMethod: "VNPAY" }
          : { paymentMethod: method, mockOutcome: "SUCCESS" }),
      }, token, crypto.randomUUID());

      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      } else if (result.paymentStatus === "SUCCESS") {
        router.push(`/success/${id}`);
      } else {
        await load();
        setError(result.message);
      }
    } catch (err) {
      setError(errorMessage(err, "Thanh toán không thành công"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container inner-page">
      <div className="breadcrumbs">
        <Link href="/orders">← Đơn hàng của tôi</Link>
      </div>

      {loading ? (
        <div className="empty-state">Đang tải chi tiết...</div>
      ) : !order ? (
        <div className="empty-state">
          <h2>Không xem được đơn hàng</h2>
          <p>{error}</p>

          <Link href="/orders" className="btn">
            Quay lại
          </Link>
        </div>
      ) : (
        <>
          <PageHeading
            eyebrow="CHI TIẾT ĐƠN HÀNG"
            title={`Đơn #${order.orderCode.slice(-8)}`}
            description={`Đặt vào ${dateTime(order.createdAt)}`}
          />

          <div className="cart-layout">
            <div className="panel">
              <h2>Trạng thái hiện tại</h2>

              <OrderStatusBadge status={order.status} />

              <div className="timeline">
                {(order.history || []).map((entry, index) => (
                  <div className="timeline-row" key={index}>
                    <span className="timeline-dot" />

                    <div>
                      <strong>
                        {statusName[entry.toStatus] || entry.toStatus}
                      </strong>

                      <p>{dateTime(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="gap-title">Các món đã đặt</h2>

              {order.items.map((item, index) => (
                <div className="order-line" key={index}>
                  <span>
                    {item.quantity} × {item.productName}
                    {" · "}Size {item.sizeName}
                    {item.toppings.length > 0
                      ? ` · ${item.toppings
                          .map((topping) => topping.name)
                          .join(", ")}`
                      : ""}
                  </span>

                  <strong>{money(item.lineTotal)}</strong>
                </div>
              ))}

              <div className="order-line total">
                <strong>Tổng thanh toán</strong>
                <strong>{money(order.totalAmount)}</strong>
              </div>

              {error && (
                <div role="alert" className="error-box">
                  {error}
                </div>
              )}

              {["PENDING", "PAYMENT_FAILED"].includes(order.status) && (
                <div className="order-tools">
                  <h3>Thanh toán đơn này</h3>

                  {vnpayEnabled ? (
                    <p>VNPay Sandbox</p>
                  ) : (
                    <select
                      value={method}
                      onChange={(event) =>
                        setMethod(event.target.value as MockPaymentMethod)
                      }
                      aria-label="Phương thức thanh toán"
                    >
                      <option value="EWALLET">Ví điện tử (giả lập)</option>

                      <option value="CARD">Thẻ ngân hàng (giả lập)</option>
                    </select>
                  )}

                  <button className="btn" onClick={pay} disabled={busy}>
                    {busy
                      ? "Đang xử lý..."
                      : pendingVnpay
                        ? "Tiếp tục thanh toán ↗"
                        : "Thanh toán lại ↗"}
                  </button>
                </div>
              )}

              {order.status === "PENDING" && !pendingVnpay && (
                <button className="danger-btn" disabled={busy} onClick={cancel}>
                  Hủy đơn hàng
                </button>
              )}
            </div>

            <div className="panel summary">
              <div className="side-illustration">🥤</div>

              <h2>Cảm ơn bạn đã chọn BrewLite!</h2>

              <p className="muted">
                Các trạng thái đơn hàng sẽ được cập nhật khi quán xử lý. Vui
                lòng ghé quầy nhận nước khi đơn sẵn sàng.
              </p>

              <button
                className="btn btn-block"
                disabled={busy || loading}
                onClick={() => void refreshOrder()}
              >
                ↻ Cập nhật trạng thái
              </button>

              <Link href="/menu" className="text-link">
                Đặt thêm món →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
