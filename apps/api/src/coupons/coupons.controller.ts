import { Controller, Get, Query } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get()
  async list() {
    return this.couponsService.listActive();
  }

  @Get('validate')
  async validate(
    @Query('code') code: string,
    @Query('amount') amount: string,
  ) {
    const orderAmount = Number(amount) || 0;
    return this.couponsService.validateCoupon(code, orderAmount);
  }
}
