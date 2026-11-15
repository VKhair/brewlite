"use client";
import Link from "next/link";
import { useStore } from "../../lib/store";
import { money, drinkPhoto } from "../../lib/api";
import { PageHeading, Quantity } from "../../components/ui";
export default function Cart() {
  const { cart, change, remove, total, count, ready } = useStore();
  return (
    <div className="container inner-page">
      <PageHeading
        eyebrow="GIỎ HÀNG CỦA BẠN"
        title="Sắp có đồ uống ngon rồi!"
        description="Kiểm tra lại những món bạn đã chọn trước khi đặt hàng."
      />
      {!ready ? (
        <div className="empty-state">Đang tải giỏ hàng...</div>
      ) : !cart.length ? (
        <div className="empty-state">
          <div className="empty-icon">🛍️</div>
          <h2>Giỏ hàng đang trống</h2>
          <p>Chưa có món nào trong giỏ. Ghé menu tìm thức uống hợp gu nhé!</p>
          <Link className="btn" href="/menu">
            Khám phá thực đơn ↗
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="panel">
            <h2>
              Món đã chọn <span className="muted">({count})</span>
            </h2>
            {cart.map((item) => (
              <div className="cart-item" key={item.key}>
                <div className="mini-drink">
                  <img
                    src={item.imageUrl || drinkPhoto(item.name, item.category)}
                    alt={item.name}
                  />
                </div>
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p>
                    Size {item.sizeName}
                    {item.toppingNames.length
                      ? ` · ${item.toppingNames.join(", ")}`
                      : ""}
                  </p>
                  <strong>{money(item.unitPrice)}</strong>
                </div>
                <div className="cart-item-actions">
                  <button className="remove" onClick={() => remove(item.key)}>
                    Xóa ×
                  </button>
                  <Quantity
                    quantity={item.quantity}
                    onChange={(n) => change(item.key, n)}
                  />
                </div>
              </div>
            ))}
            <Link className="text-link" href="/menu">
              ← Tiếp tục chọn món
            </Link>
          </div>
          <div className="panel summary">
            <h2>Đơn hàng của bạn</h2>
            <div className="summary-line">
              <span>Tạm tính ({count} món)</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="summary-line">
              <span>Phí dịch vụ</span>
              <strong className="green">Miễn phí</strong>
            </div>
            <hr />
            <div className="summary-total">
              <span>Tổng thanh toán</span>
              <strong>{money(total)}</strong>
            </div>
            <p className="summary-note">
              ☕ Nhận nước trực tiếp tại quầy BrewLite.
            </p>
            <Link href="/checkout" className="btn btn-block">
              Tiến hành thanh toán ↗
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
