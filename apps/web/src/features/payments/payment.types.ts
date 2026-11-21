export type MockPaymentMethod = "EWALLET" | "CARD";

export type PaymentInput = { orderId: string } & (
  | { paymentMethod: "VNPAY" }
  | { paymentMethod: MockPaymentMethod; mockOutcome: "SUCCESS" | "FAILURE" }
);

export type PaymentResult = {
  orderId: string;
  status: string;
  paymentStatus: string;
  message: string;
  cartAction: "CLEAR" | "KEEP";
  checkoutUrl?: string;
};
