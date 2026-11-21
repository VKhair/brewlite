import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppStore } from "@/app/app-providers";
import { getOrder } from "./orders.api";
import type { Order } from "./order.types";

const paidStatuses = ["PAID", "PREPARING", "READY", "COMPLETED"];

export function useOrderConfirmation() {
  const { id } = useParams<{ id: string }>(),
    { ready, session, clearPaidCart } = useAppStore(),
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
        const result = await getOrder(id, token, controller.signal);
        if (controller.signal.aborted) return;
        setOrder(result);
        setError("");
        if (paidStatuses.includes(result.status)) clearPaidCart(id);
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
  }, [id, ready, session, router, clearPaidCart, refresh]);

  return {
    id,
    order,
    error,
    paid: !!order && paidStatuses.includes(order.status),
    retry: () => setRefresh((value) => value + 1),
  };
}
