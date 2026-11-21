import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { AuthRequest } from '../auth/auth.types';
import { JwtGuard } from '../auth/jwt.guard';
import { validationFailure } from '../common/validation/validation-error';
import { PaymentDto } from './payments.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}
  @Post()
  @HttpCode(200)
  @UseGuards(JwtGuard)
  pay(
    @Req() req: AuthRequest,
    @Headers('idempotency-key') key: string,
    @Body() dto: PaymentDto,
    @Ip() ip: string,
  ) {
    if (typeof key !== 'string' || !isUUID(key, '4'))
      throw validationFailure([
        {
          field: 'headers.idempotency-key',
          messages: ['Idempotency-Key must be a UUID v4'],
        },
      ]);
    return this.payments.pay(req.user.id, key, dto, ip);
  }
}
