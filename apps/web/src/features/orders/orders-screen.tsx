"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { money, dateTime } from "@/shared/format";
import { listOrders } from "./orders.api";
import type { Order } from "./order.types";
import { useAppStore } from "@/app/app-providers";
import { PageHeading } from "@/shared/ui/page-heading";
import { OrderStatusBadge } from "@/features/orders/order-status-badge";
export default function Orders() {
  const { ready, session } = useAppStore(),
    router = useRouter(),
    [orders, setOrders] = useState<Order[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    if (ready && !session) router.replace("/login?next=%2Forders");
    if (!session) return;
    let active = true;
    listOrders(session.access_token)
      .then((v) => {
        if (active) setOrders(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [ready, session, router]);
  return (
    <div className="container inner-page">
      <PageHeading
        eyebrow="LỊCH SỬ BREWLITE"
        title="Đơn hàng của tôi"
        description="Xem lại thức uống đã đặt và theo dõi trạng thái đơn hàng."
      />
      {!ready || !session || busy ? (
        <div className="empty-state">Đang tải đơn hàng...</div>
      ) : error ? (
        <div className="empty-state">
          <h2>Không tải được đơn hàng</h2>
          <p>{error}</p>
          <button className="btn" onClick={() => window.location.reload()}>
            Thử lại
          </button>
        </div>
      ) : orders.length ? (
        <div className="orders-list">
          {orders.map((o) => (
            <Link
              className="order-card"
              href={`/orders/${o.orderId}`}
              key={o.orderId}
            >
              <div className="order-icon">☕</div>
              <div className="order-main">
                <span className="muted small">{dateTime(o.createdAt)}</span>
                <h3>Đơn #{o.orderCode.slice(-8)}</h3>
                <p>
                  {o.items
                    .map((i) => `${i.productName} ×${i.quantity}`)
                    .join(" · ")}
                </p>
              </div>
              <div className="order-side">
                <OrderStatusBadge status={o.status} />
                <strong>{money(o.totalAmount)}</strong>
                <span className="text-link">Chi tiết →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📜</div>
          <h2>Bạn chưa có đơn hàng nào</h2>
          <p>Hãy chọn một món ngon và bắt đầu đơn đầu tiên nhé!</p>
          <Link href="/menu" className="btn">
            Khám phá menu ↗
          </Link>
        </div>
      )}
    </div>
  );
}
