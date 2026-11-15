import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { PaymentProvider, PaymentResult } from './payment-provider';

function timestamp(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date).replace(/[-: ]/g, '');
}
function signature(params: URLSearchParams, secret: string) {
  const encoded = [...params.entries()].filter(([key]) => key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType')
    .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
  return createHmac('sha512', secret).update(encoded, 'utf8').digest('hex');
}

@Injectable()
export class VnpayProvider implements PaymentProvider {
  readonly mode = 'vnpay' as const;
  private readonly tmnCode = process.env.VNPAY_TMN_CODE ?? '';
  private readonly secret = process.env.VNPAY_HASH_SECRET ?? '';
  private readonly endpoint = process.env.VNPAY_PAYMENT_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly returnUrl = process.env.VNPAY_RETURN_URL ?? '';
  constructor() {
    if (!this.tmnCode || !this.secret || !this.returnUrl) throw new Error('VNPAY_TMN_CODE, VNPAY_HASH_SECRET and VNPAY_RETURN_URL are required when PAYMENT_MODE=vnpay.');
  }
  async charge(): Promise<PaymentResult> { throw new Error('VNPay requires redirect checkout and signed callback settlement.'); }
  checkout(input: { orderCode: string; amount: number; ip: string }) {
    const now = new Date();
    const params = new URLSearchParams({
      vnp_Version: '2.1.0', vnp_Command: 'pay', vnp_TmnCode: this.tmnCode,
      vnp_Amount: String(input.amount * 100), vnp_CurrCode: 'VND', vnp_TxnRef: input.orderCode,
      vnp_OrderInfo: `Thanh toan don hang ${input.orderCode}`, vnp_OrderType: 'other',
      vnp_Locale: 'vn', vnp_ReturnUrl: this.returnUrl, vnp_IpAddr: input.ip,
      vnp_CreateDate: timestamp(now), vnp_ExpireDate: timestamp(new Date(now.getTime() + 15 * 60_000)),
    });
    params.set('vnp_SecureHash', signature(params, this.secret));
    return `${this.endpoint}?${params.toString()}`;
  }
  verify(query: Record<string, unknown>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (key.startsWith('vnp_') && typeof value === 'string') params.set(key, value);
    const supplied = params.get('vnp_SecureHash') ?? '';
    params.delete('vnp_SecureHash'); params.delete('vnp_SecureHashType');
    const expected = signature(params, this.secret);
    const a = Buffer.from(supplied, 'hex'), b = Buffer.from(expected, 'hex');
    const valid = a.length === b.length && a.length === 64 && timingSafeEqual(a, b);
    return { valid, params };
  }
}
