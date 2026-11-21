import { Controller, Get, HttpCode, Logger, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { VnpayCallbackService } from './vnpay-callback.service';

@Controller('payments/vnpay')
export class VnpayCallbackController {
  private readonly logger = new Logger(VnpayCallbackController.name);

  constructor(private readonly callbacks: VnpayCallbackService) {}

  @Get('ipn')
  @HttpCode(200)
  async ipn(@Query() query: Record<string, unknown>) {
    const messages = {
      '00': 'Confirm Success',
      '01': 'Order not found',
      '02': 'Order already confirmed',
      '04': 'Invalid amount',
      '97': 'Invalid signature',
      '99': 'Unknown error',
    };
    try {
      const code = await this.callbacks.settleVnpay(query);
      return { RspCode: code, Message: messages[code] };
    } catch {
      this.logger.error('VNPay IPN processing failed');
      return { RspCode: '99', Message: messages['99'] };
    }
  }
  @Get('return')
  async returnFromVnpay(
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const orderId = await this.callbacks.lookupVnpayReturn(query);
    const web = process.env.VNPAY_FRONTEND_URL || 'http://localhost:3002';
    return res.redirect(
      orderId
        ? `${web}/success/${orderId}`
        : `${web}/orders?payment=unverified`,
    );
  }
}
