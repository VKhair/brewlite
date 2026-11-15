
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  getCartSnapshot,
  getServerCartSnapshot,
  subscribeCart,
  parseCart,
} from "../../lib/cart-store";
import { saveOrder } from "../../lib/orders-store";
import { getAccessToken } from "../../lib/auth";

const API_URL = "/api";

export default function CheckoutPage() {
  const router = useRouter();

  const cartSnapshot = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getServerCartSnapshot
  );

  const cart = parseCart(cartSnapshot);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState("ewallet");
const [isSubmitting, setIsSubmitting] = useState(false);

  const total = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const formatPrice = (price: number) =>
    price.toLocaleString("vi-VN") + "đ";

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Giỏ hàng của bạn đang trống!");
    return;
  }

  const token = getAccessToken();

  if (!token) {
    alert("Vui lòng đăng nhập trước khi đặt hàng.");
    router.push("/login");
    return;
  }

  if (isSubmitting) return;

  try {
    setIsSubmitting(true);

    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          productId: item.productId,
          sizeId: item.sizeId,
          quantity: item.quantity,
          toppingIds: item.toppingIds,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Không thể tạo đơn hàng. Vui lòng thử lại."
      );
    }

    const images: Record<string, string> = {
      "10000000-0000-4000-8000-000000000001": "/images/coffee-milk.jpg",
      "10000000-0000-4000-8000-000000000002": "/images/peach-tea.jpg",
      "10000000-0000-4000-8000-000000000003": "/images/matcha-freeze.jpg",
      "10000000-0000-4000-8000-000000000004": "/images/cacao-ice.jpg",
    };

    const pendingOrder = {
      orderId: data.orderId,
      orderCode: data.orderCode,
      customer: {
        name,
        phone,
        address,
        note,
      },
      items: cart.map((item) => ({
        ...item,
        imageUrl: images[item.productId] || item.imageUrl || "",
      })),
      total: data.totalAmount,
      payment,
      createdAt: data.createdAt || new Date().toISOString(),
      status: data.status,
    };

    localStorage.setItem(
      "brewLiteLastOrder",
      JSON.stringify(pendingOrder)
    );

    saveOrder(pendingOrder);

    router.push("/payment");
  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi đặt hàng."
    );
  } finally {
    setIsSubmitting(false);
  }
};
  const inputClass =
    "mt-2 w-full rounded-xl border border-[#e8ded4] bg-[#fdfcfb] px-4 py-3 text-sm text-[#3d3027] outline-none transition placeholder:text-[#b5a99d] focus:border-[#a17a53]";

  return (
    <main className="min-h-screen bg-[#faf8f5] px-4 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/cart"
          className="text-sm font-medium text-[#8b6b4a] hover:text-[#5f4631]"
        >
          ← Quay lại giỏ hàng
        </Link>

        <div className="mt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#a58a70]">
            Almost yours
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#3d3027] sm:text-4xl">
            Thanh toán
          </h1>

          <p className="mt-2 text-sm text-[#897d72]">
            Hoàn tất thông tin để BrewLite chuẩn bị đơn hàng cho bạn.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[#eee7df] bg-white p-10 text-center">
            <div className="text-4xl">☕</div>
            <h2 className="mt-4 text-lg font-bold text-[#3d3027]">
              Giỏ hàng đang trống
            </h2>
            <p className="mt-2 text-sm text-[#897d72]">
              Bạn cần chọn sản phẩm trước khi thanh toán.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-[#8b6b4a] px-7 py-3 text-sm font-semibold text-white hover:bg-[#705338]"
            >
              Khám phá menu
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]"
          >
            {/* Customer information */}
            <div className="space-y-6">
              <section className="rounded-2xl border border-[#eee7df] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#a58a70]">
                    Step 01
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[#3d3027]">
                    Thông tin nhận hàng
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-[#59483a]">
                      Họ và tên người nhận *
                    </label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#59483a]">
                      Số điện thoại *
                    </label>
                    <input
                      required
                      type="tel"
                      pattern="[0-9]{10,11}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#59483a]">
                      Địa chỉ giao hàng *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#59483a]">
                      Ghi chú đơn hàng
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ví dụ: Ít đá, ít đường..."
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                </div>
              </section>

              {/* Payment method */}
              <section className="rounded-2xl border border-[#eee7df] bg-white p-5 shadow-sm sm:p-7">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#a58a70]">
                    Step 02
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[#3d3027]">
                    Phương thức thanh toán
                  </h2>
                </div>

                <div className="space-y-3">
                                <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  payment === "ewallet"
                    ? "border-[#a17a53] bg-[#faf6f1]"
                    : "border-[#eee7df] hover:bg-[#fdfcfb]"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="ewallet"
                  checked={payment === "ewallet"}
                  onChange={(e) => setPayment(e.target.value)}
                  className="accent-[#8b6b4a]"
                />
                <span className="text-xl">📱</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-[#3d3027]">
                    Ví điện tử
                  </span>
                  <span className="mt-1 block text-xs text-[#897d72]">
                    Thanh toán bằng ví điện tử (mô phỏng)
                  </span>
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                  payment === "card"
                    ? "border-[#a17a53] bg-[#faf6f1]"
                    : "border-[#eee7df] hover:bg-[#fdfcfb]"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={payment === "card"}
                  onChange={(e) => setPayment(e.target.value)}
                  className="accent-[#8b6b4a]"
                />
                <span className="text-xl">💳</span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-[#3d3027]">
                    Thẻ ngân hàng (Visa/Mastercard)
                  </span>
                  <span className="mt-1 block text-xs text-[#897d72]">
                    Thanh toán bằng thẻ ngân hàng (mô phỏng)
                  </span>
                </span>
              </label>
                </div>
              </section>
            </div>

            {/* Order summary */}
            <aside className="rounded-2xl border border-[#eee7df] bg-white p-5 shadow-sm lg:sticky lg:top-6 sm:p-6">
              <h2 className="text-lg font-bold text-[#3d3027]">
                Đơn hàng của bạn
              </h2>

              <div className="mt-5 max-h-72 space-y-4 overflow-y-auto">
                {cart.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.size}-${index}`}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#3d3027]">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-[#897d72]">
                        {item.size} · Số lượng: {item.quantity}
                      </p>
                      {item.toppings?.length > 0 && (
                        <p className="mt-1 text-xs text-[#897d72]">
                          {item.toppings.join(", ")}
                        </p>
                      )}
                    </div>

                    <span className="shrink-0 text-sm font-medium text-[#795b40]">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="my-5 border-t border-dashed border-[#e8ded4]" />

              <div className="flex justify-between text-sm text-[#766b60]">
                <span>Tạm tính</span>
                <span>{formatPrice(total)}</span>
              </div>

              <div className="mt-3 flex justify-between text-sm text-[#766b60]">
                <span>Phí vận chuyển</span>
                <span className="text-xs">Tính khi xác nhận</span>
              </div>

              <div className="my-5 border-t border-[#eee7df]" />

              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[#3d3027]">
                  Tổng cộng
                </span>
                <span className="text-xl font-bold text-[#8b6b4a]">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                type="submit"
                className="mt-7 w-full rounded-full bg-[#8b6b4a] py-3.5 text-sm font-bold text-white transition hover:bg-[#705338]"
              >
                Xác nhận đặt hàng →
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-[#9a8d81]">
                Bằng việc đặt hàng, bạn xác nhận thông tin đơn hàng là chính xác.
              </p>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
