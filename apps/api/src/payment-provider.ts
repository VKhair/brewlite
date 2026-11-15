import { Injectable } from '@nestjs/common';

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

export function createPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_MODE ?? 'mock';
  if (mode === 'vnpay') {
    const { VnpayProvider } = require('./vnpay') as typeof import('./vnpay');
    return new VnpayProvider();
  }
  if (mode !== 'mock') throw new Error('PAYMENT_MODE must be mock or vnpay.');
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
    throw new Error('Mock payments are disabled in production.');
  }
  return new MockPaymentProvider();
}

/** Local-only payment adapter. A redirect-based provider must settle through a verified callback. */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly mode = 'mock' as const;
  async charge(input: Parameters<PaymentProvider['charge']>[0]): Promise<PaymentResult> {
    return input.outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
  }
}
