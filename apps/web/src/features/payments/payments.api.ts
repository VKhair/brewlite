import { api } from "@/shared/api/http-client";
import type { PaymentInput, PaymentResult } from "./payment.types";

export function payForOrder(
  input: PaymentInput,
  token: string,
  idempotencyKey: string,
) {
  return api<PaymentResult>(
    "/payments",
    {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    },
    token,
  );
}
