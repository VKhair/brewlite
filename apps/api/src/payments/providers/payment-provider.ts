export type MockOutcome = 'SUCCESS' | 'FAILURE';
export type PaymentResult = 'SUCCESS' | 'FAILED';

export interface PaymentProvider {
  readonly mode: 'mock' | 'vnpay';
  charge(input: {
    orderId: string;
    orderCode: string;
    amount: number;
    currency: 'VND';
    outcome: MockOutcome;
  }): Promise<PaymentResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
