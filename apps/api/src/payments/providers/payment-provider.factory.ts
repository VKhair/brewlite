import { MockPaymentProvider } from './mock-payment.provider';
import type { PaymentProvider } from './payment-provider';
import { VnpayProvider } from './vnpay.provider';

export function createPaymentProvider(): PaymentProvider {
  const mode = process.env.PAYMENT_MODE ?? 'mock';
  if (mode === 'vnpay') {
    return new VnpayProvider();
  }
  if (mode !== 'mock') throw new Error('PAYMENT_MODE must be mock or vnpay.');
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ALLOW_MOCK_PAYMENTS !== 'true'
  ) {
    throw new Error('Mock payments are disabled in production.');
  }
  return new MockPaymentProvider();
}
