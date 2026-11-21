import { Injectable } from '@nestjs/common';
import type { PaymentProvider, PaymentResult } from './payment-provider';

/** Local-only payment adapter. A redirect-based provider must settle through a verified callback. */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  readonly mode = 'mock' as const;
  async charge(
    input: Parameters<PaymentProvider['charge']>[0],
  ): Promise<PaymentResult> {
    return input.outcome === 'SUCCESS' ? 'SUCCESS' : 'FAILED';
  }
}
