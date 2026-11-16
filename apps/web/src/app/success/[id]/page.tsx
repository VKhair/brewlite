"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, Order, money } from "../../../lib/api";
import { useStore } from "../../../lib/store";
import { Status } from "../../../components/ui";
export default function Success() {
  const { id } = useParams<{ id: string }>(),
    { ready, session, clear } = useStore(),
    router = useRouter(),
    [order, setOrder] = useState<Order | null>(null),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!session) {
      if (ready)
        router.replace(`/login?next=${encodeURIComponent(`/success/${id}`)}`);
      return;
    }
    const token = session.access_token;
    const deadline = Date.now() + 30_000;
    const controller = new AbortController();
    let timer: number | undefined;
    async function load() {
      try {
        const result = await api<Order>(
          `/orders/${id}`,
          { signal: controller.signal },
          token,
        );
        if (controller.signal.aborted) return;
        setOrder(result);
        setError("");
        if (["PAID", "PREPARING", "READY", "COMPLETED"].includes(result.status))
          clear();
        if (result.status === "PENDING" && Date.now() + 2_000 <= deadline) {
          timer = window.setTimeout(() => void load(), 2_000);
        }
      } catch (err) {
        if (!controller.signal.aborted)
          setError(
            err instanceof Error
              ? err.message
              : "Không lấy được trạng thái đơn.",
          );
      }
    }
    void load();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [id, ready, session, router, clear, refresh]);
  const paid =
    !!order &&
    ["PAID", "PREPARING", "READY", "COMPLETED"].includes(order.status);
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
                <Status status={order.status} />
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
              onClick={() => setRefresh((value) => value + 1)}
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
