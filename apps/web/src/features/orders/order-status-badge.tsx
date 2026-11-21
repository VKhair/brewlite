export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {(
        {
          PAID: "✓ ",
          READY: "✓ ",
          COMPLETED: "✓ ",
          PAYMENT_FAILED: "! ",
          CANCELLED: "× ",
        } as Record<string, string>
      )[status] || "• "}
      {(
        {
          PENDING: "Chờ thanh toán",
          PAID: "Đã thanh toán",
          PREPARING: "Đang pha chế",
          READY: "Có thể nhận nước",
          COMPLETED: "Hoàn thành",
          PAYMENT_FAILED: "Thanh toán lỗi",
          CANCELLED: "Đã hủy",
        } as Record<string, string>
      )[status] || status}
    </span>
  );
}
