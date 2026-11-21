import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/app/app-providers";
import { createOrder } from "@/features/orders/orders.api";
import { payForOrder } from "@/features/payments/payments.api";
import type { MockPaymentMethod } from "@/features/payments/payment.types";

export function useCheckout() {
  const { cart, total, session, ready, clear } = useAppStore(),
    router = useRouter();
  const vnpayEnabled = process.env.NEXT_PUBLIC_PAYMENT_MODE === "vnpay";
  const [mockMethod, setMethod] = useState<MockPaymentMethod>("EWALLET"),
    [failDemo, setFailDemo] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pendingOrder, setPendingOrder] = useState<string | null>(null);
  const inFlight = useRef(false);
  const key = useRef<string | null>(null);
  const method = vnpayEnabled ? "VNPAY" : mockMethod;
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
        const order = await createOrder(
          cart.map((item) => ({
            productId: item.productId,
            sizeId: item.sizeId,
            quantity: item.quantity,
            toppingIds: item.toppingIds,
          })),
          session.access_token,
        );
        orderId = order.orderId;
        setPendingOrder(orderId);
        key.current = null;
      }
      if (!key.current) key.current = crypto.randomUUID();
      const payment = await payForOrder(
        {
          orderId,
          ...(method === "VNPAY"
            ? { paymentMethod: method }
            : {
                paymentMethod: method,
                mockOutcome: failDemo ? "FAILURE" : "SUCCESS",
              }),
        },
        session.access_token,
        key.current,
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

  function selectPaymentMethod(next: MockPaymentMethod) {
    setMethod(next);
    key.current = null;
  }

  function selectMockFailure(next: boolean) {
    setFailDemo(next);
    key.current = null;
  }

  return {
    cart,
    total,
    session,
    ready,
    vnpayEnabled,
    method,
    selectPaymentMethod,
    failDemo,
    selectMockFailure,
    busy,
    error,
    pendingOrder,
    checkout,
  };
}
