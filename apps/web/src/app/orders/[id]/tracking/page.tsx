
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessToken } from "../../../../lib/auth";
import { getOrderById, type Order } from "../../../../lib/orders-store";

const API_URL = "/api";

type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "PAYMENT_FAILED"
  | "CANCELLED";

type TrackingStep = {
  status: OrderStatus;
  title: string;
  description: string;
};

const steps: TrackingStep[] = [
  {
    status: "PENDING",
    title: "Đơn hàng đã được tạo",
    description: "Đơn hàng của bạn đã được ghi nhận.",
  },
  {
    status: "PAID",
    title: "Đã thanh toán",
    description: "Thanh toán đơn hàng thành công.",
  },
  {
    status: "PREPARING",
    title: "Đang pha chế",
    description: "Cửa hàng đang pha chế và chuẩn bị đơn hàng.",
  },
  {
    status: "READY",
    title: "Đã sẵn sàng",
    description: "Đơn hàng đã được chuẩn bị xong.",
  },
  {
    status: "COMPLETED",
    title: "Đã hoàn thành",
    description: "Đơn hàng đã hoàn tất.",
  },
];

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha chế",
  READY: "Đã sẵn sàng",
  COMPLETED: "Đã hoàn thành",
  PAYMENT_FAILED: "Thanh toán thất bại",
  CANCELLED: "Đã hủy",
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function TrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = decodeURIComponent(params.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchOrder() {
      try {
        setLoading(true);
        setError("");

        const token = getAccessToken();

        if (!token) {
          throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        const response = await fetch(
          `${API_URL}/orders/${encodeURIComponent(orderId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Không thể tải thông tin đơn hàng."
          );
        }

        if (!active) return;

        const localOrder = getOrderById(orderId);

        setOrder(localOrder);
        setStatus(data.status as OrderStatus);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải đơn hàng."
        );

        setOrder(getOrderById(orderId));
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] px-4 py-16">
        <div className="mx-auto max-w-4xl text-center text-gray-500">
          Đang tải thông tin đơn hàng...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900">
          Không tìm thấy đơn hàng
        </h1>
        <p className="mt-3 text-gray-500">
          Đơn hàng không tồn tại hoặc chưa có thông tin lưu trên thiết bị.
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-block rounded-xl bg-[#6F4E37] px-6 py-3 text-white"
        >
          Quay lại đơn hàng
        </Link>
      </main>
    );
  }

  const currentIndex = status
    ? steps.findIndex((step) => step.status === status)
    : -1;

  const isFailed =
    status === "PAYMENT_FAILED" || status === "CANCELLED";

  return (
    <main className="min-h-screen bg-[#FAF7F2] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/orders"
          className="text-sm text-[#8B6B50] hover:underline"
        >
          ← Quay lại đơn hàng
        </Link>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Theo dõi đơn hàng
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Mã đơn hàng: {order.orderId}
              </p>
            </div>

            {status && (
              <span className="rounded-full bg-[#F4EBDD] px-4 py-2 text-sm font-semibold text-[#76563C]">
                {statusLabels[status]}
              </span>
            )}
          </div>

          {error && (
            <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {isFailed ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5">
              <h2 className="font-bold text-red-700">
                {status === "PAYMENT_FAILED"
                  ? "Thanh toán thất bại"
                  : "Đơn hàng đã bị hủy"}
              </h2>
              <p className="mt-2 text-sm text-red-600">
                {status === "PAYMENT_FAILED"
                  ? "Bạn có thể kiểm tra lại phương thức thanh toán và thử lại."
                  : "Đơn hàng này đã kết thúc và không thể tiếp tục xử lý."}
              </p>
            </div>
          ) : (
            <div className="mt-8">
              {steps.map((step, index) => {
                const completed = currentIndex >= index;
                const active = currentIndex === index;

                return (
                  <div
                    key={step.status}
                    className="relative flex gap-4 pb-8 last:pb-0"
                  >
                    {index !== steps.length - 1 && (
                      <div
                        className={`absolute left-[15px] top-8 h-full w-0.5 ${
                          completed && currentIndex > index
                            ? "bg-[#8B6B50]"
                            : "bg-gray-200"
                        }`}
                      />
                    )}

                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        completed
                          ? "bg-[#8B6B50] text-white"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {completed ? "✓" : index + 1}
                    </div>

                    <div className="pt-1">
                      <h3
                        className={`font-semibold ${
                          active
                            ? "text-[#76563C]"
                            : completed
                              ? "text-gray-800"
                              : "text-gray-400"
                        }`}
                      >
                        {step.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {step.description}
                      </p>

                      {active && (
                        <span className="mt-2 inline-block rounded-full bg-[#F4EBDD] px-3 py-1 text-xs font-medium text-[#76563C]">
                          Trạng thái hiện tại
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="my-8 border-t border-gray-100" />

          <h2 className="text-lg font-bold text-gray-900">
            Thông tin giao hàng
          </h2>

          <div className="mt-4 space-y-3 text-sm">
            <p>
              <span className="text-gray-500">Người nhận: </span>
              <span className="font-medium text-gray-800">
                {order.customer.name}
              </span>
            </p>

            <p>
              <span className="text-gray-500">Số điện thoại: </span>
              <span className="font-medium text-gray-800">
                {order.customer.phone}
              </span>
            </p>

            <p>
              <span className="text-gray-500">Địa chỉ: </span>
              <span className="font-medium text-gray-800">
                {order.customer.address}
              </span>
            </p>

            {order.customer.note && (
              <p>
                <span className="text-gray-500">Ghi chú: </span>
                <span className="font-medium text-gray-800">
                  {order.customer.note}
                </span>
              </p>
            )}
          </div>

          <div className="my-8 border-t border-gray-100" />

          <h2 className="text-lg font-bold text-gray-900">
            Chi tiết đơn hàng
          </h2>

          <div className="mt-4 space-y-3">
            {order.items.map((item, index) => (
              <div
                key={`${item.productId}-${index}`}
                className="flex justify-between gap-4 text-sm"
              >
                <div>
                  <p className="font-medium text-gray-800">
                    {item.name} × {item.quantity}
                  </p>
                  <p className="mt-1 text-gray-500">
                    {item.size}
                    {item.toppings.length > 0
                      ? ` · ${item.toppings.join(", ")}`
                      : ""}
                  </p>
                </div>

                <p className="shrink-0 font-medium text-gray-800">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between border-t border-gray-100 pt-4">
            <span className="font-semibold text-gray-800">
              Tổng thanh toán
            </span>
            <span className="font-bold text-[#76563C]">
              {formatPrice(order.total)}
            </span>
          </div>

          <Link
            href="/orders"
            className="mt-8 inline-block rounded-xl border border-[#8B6B50] px-6 py-3 font-medium text-[#76563C] hover:bg-[#F4EBDD]"
          >
            Quay lại danh sách đơn hàng
          </Link>
        </div>
      </div>
    </main>
  );
}
