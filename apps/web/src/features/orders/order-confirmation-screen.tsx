"use client";

import Link from "next/link";
import { money } from "@/shared/format";
import { OrderStatusBadge } from "./order-status-badge";
import { useOrderConfirmation } from "./use-order-confirmation";

export default function Success() {
  const { id, order, error, paid, retry } = useOrderConfirmation();
  const pending = order?.status === "PENDING";
  const failed = order?.status === "PAYMENT_FAILED";
  return (
    <div className="container inner-page success-wrap">
      <div className="success-card">
        {paid && <div className="success-check">✓</div>}
        <span className="eyebrow">ĐƠN HÀNG CỦA BẠN</span>
        <h1>
          {paid
            ? "Đặt hàng thành công!"
            : failed
              ? "Thanh toán chưa thành công"
              : pending
                ? "Đang chờ VNPay xác nhận"
                : "Thông tin đơn hàng"}
        </h1>
        <p>
          {paid
            ? "Đồ uống thơm ngon đang trên đường đến với bạn."
            : failed
              ? "Bạn có thể thanh toán lại từ trang chi tiết đơn hàng."
              : null}
        </p>
        {order ? (
          <>
            <div className="success-info">
              <div>
                <span>Mã đơn</span>
                <strong>#{order.orderCode.slice(-8)}</strong>
              </div>
              <div>
                <span>Trạng thái</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <div>
                <span>Tổng tiền</span>
                <strong>{money(order.totalAmount)}</strong>
              </div>
            </div>
            {paid && (
              <p className="muted small">
                Vui lòng theo dõi trạng thái và nhận nước tại quầy khi sẵn sàng.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
          </>
        ) : (
          <p className="muted">{error || "Đang tải đơn hàng..."}</p>
        )}
        <div className="success-actions">
          {(pending || error) && (
            <button
              className="btn btn-secondary"
              onClick={retry}
            >
              Cập nhật trạng thái
            </button>
          )}
          <Link className="btn" href={`/orders/${id}`}>
            {failed ? "Thanh toán lại →" : "Theo dõi đơn hàng →"}
          </Link>
          <Link className="btn btn-secondary" href="/menu">
            Tiếp tục khám phá
          </Link>
        </div>
      </div>
    </div>
  );
}
