import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { PaymentProvider, PaymentResult } from './payment-provider';

function timestamp(date = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace(/[-: ]/g, '');
}
function signingData(params: URLSearchParams) {
  const encode = (value: string) =>
    encodeURIComponent(value).replace(/%20/g, '+');
  params.sort();
  return [...params]
    .map(([key, value]) => `${encode(key)}=${encode(value)}`)
    .join('&');
}

export const VNPAY_CHECKOUT_TTL_MS = 15 * 60_000;

@Injectable()
export class VnpayProvider implements PaymentProvider {
  readonly mode = 'vnpay' as const;
  readonly tmnCode = process.env.VNPAY_TMN_CODE ?? '';
  private readonly secret = process.env.VNPAY_HASH_SECRET ?? '';
  private readonly endpoint =
    process.env.VNPAY_PAYMENT_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  private readonly returnUrl = process.env.VNPAY_RETURN_URL ?? '';
  constructor() {
    if (!this.tmnCode || !this.secret || !this.returnUrl)
      throw new Error(
        'VNPAY_TMN_CODE, VNPAY_HASH_SECRET and VNPAY_RETURN_URL are required when PAYMENT_MODE=vnpay.',
      );
    if (this.endpoint !== 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html')
      throw new Error(
        'VNPAY_PAYMENT_URL must point to the VNPay Sandbox payment endpoint.',
      );
  }
  async charge(): Promise<PaymentResult> {
    throw new Error(
      'VNPay requires redirect checkout and signed callback settlement.',
    );
  }
  checkout(input: { orderCode: string; amount: number; ip: string }) {
    const now = new Date();
    const params = new URLSearchParams({
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Amount: String(input.amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: input.orderCode,
      vnp_OrderInfo: `Thanh toan don hang ${input.orderCode}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: this.returnUrl,
      vnp_IpAddr: input.ip,
      vnp_CreateDate: timestamp(now),
      vnp_ExpireDate: timestamp(
        new Date(now.getTime() + VNPAY_CHECKOUT_TTL_MS),
      ),
    });
    const data = signingData(params);
    const hash = createHmac('sha512', this.secret).update(data).digest('hex');
    return `${this.endpoint}?${data}&vnp_SecureHash=${hash}`;
  }
  verify(query: Record<string, unknown>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (!key.startsWith('vnp_')) continue;
      if (typeof value !== 'string') return { valid: false, params };
      params.set(key, value);
    }
    const supplied = params.get('vnp_SecureHash') ?? '';
    params.delete('vnp_SecureHash');
    params.delete('vnp_SecureHashType');
    const expected = createHmac('sha512', this.secret)
      .update(signingData(params))
      .digest();
    const valid =
      /^[a-f0-9]{128}$/i.test(supplied) &&
      timingSafeEqual(Buffer.from(supplied, 'hex'), expected);
    return { valid, params };
  }
}
