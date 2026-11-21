import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/app/app-providers";
import { createOrder, getOrder } from "@/features/orders/orders.api";
import { payForOrder } from "@/features/payments/payments.api";
import type { MockPaymentMethod } from "@/features/payments/payment.types";

export function useCheckout() {
  const { cart, total, session, ready, currentCheckout, markCheckout, clearPaidCart } = useAppStore(),
    router = useRouter();
  const vnpayEnabled = process.env.NEXT_PUBLIC_PAYMENT_MODE === "vnpay";
  const [mockMethod, setMethod] = useState<MockPaymentMethod>("EWALLET"),
    [failDemo, setFailDemo] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [pendingOrder, setPendingOrder] = useState<string | null>(null);
  const inFlight = useRef(false);

  const method = vnpayEnabled ? "VNPAY" : mockMethod;
  useEffect(() => {
    if (ready && !session) router.replace("/login?next=%2Fcheckout");
  }, [ready, session, router]);
  async function checkout() {
    if (!session || !cart.length || inFlight.current) return;
    if (cart.length > 50) {
      setError("Má»—i Ä‘Æ¡n hÃ ng chá»‰ Ä‘Æ°á»£c chá»©a tá»‘i Ä‘a 50 dÃ²ng sáº£n pháº©m.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      const storageKey = "brewlite-checkout:" + session.user.id;
      const saved = sessionStorage.getItem(storageKey);
      const attempt: { orderId: string; key: string; payload: string } | null =
        saved ? JSON.parse(saved) : null;
      let orderId = currentCheckout();
      if (orderId && (attempt?.orderId === orderId || pendingOrder === orderId)) {
        const order = await getOrder(orderId, session.access_token);
        if (["PAID", "PREPARING", "READY", "COMPLETED"].includes(order.status)) {
          clearPaidCart(orderId);
          sessionStorage.removeItem(storageKey);
          router.push(`/success/${orderId}`);
          return;
        }
        if (order.status === "CANCELLED") orderId = null;
      } else {
        orderId = null;
      }
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
        markCheckout(orderId);
      }
      const payload = JSON.stringify([method, method === "VNPAY" ? null : failDemo]);
      const key = attempt?.orderId === orderId && attempt.payload === payload && attempt.key
        ? attempt.key : crypto.randomUUID();
      sessionStorage.setItem(storageKey, JSON.stringify({ orderId, key, payload }));
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
        key,
      );
      if (payment.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
        return;
      }
      if (payment.paymentStatus === "FAILED") {
        sessionStorage.setItem(storageKey, JSON.stringify({ orderId, key: "", payload }));
      }
      if (payment.paymentStatus === "SUCCESS") {
        clearPaidCart(orderId);
        sessionStorage.removeItem(storageKey);
        router.push(`/success/${orderId}`);
      } else {
        setError(
          `${payment.message} Báº¡n cÃ³ thá»ƒ thá»­ láº¡i hoáº·c xem Ä‘Æ¡n trong lá»‹ch sá»­.`,
        );
        setPendingOrder(orderId);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "KhÃ´ng thá»ƒ hoÃ n táº¥t thanh toÃ¡n.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return {
    cart,
    total,
    session,
    ready,
    vnpayEnabled,
    method,
    selectPaymentMethod: setMethod,
    failDemo,
    selectMockFailure: setFailDemo,
    busy,
    error,
    pendingOrder,
    checkout,
  };
}
