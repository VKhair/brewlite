import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthRequest } from '../auth/auth.types';
import { JwtGuard } from '../auth/jwt.guard';
import { uuidParam } from '../common/validation/uuid-param.pipe';
import { CreateOrderDto, StatusDto } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) {
    return this.orders.create(req.user.id, dto);
  }
  @Get('me') list(@Req() req: AuthRequest) {
    return this.orders.list(req.user.id);
  }
  @Get(':id') detail(
    @Req() req: AuthRequest,
    @Param('id', uuidParam()) id: string,
  ) {
    return this.orders.detail(req.user.id, id);
  }
  @Patch(':id/cancel') cancel(
    @Req() req: AuthRequest,
    @Param('id', uuidParam()) id: string,
  ) {
    return this.orders.cancel(req.user.id, id);
  }
  @Patch(':id/status') updateStatus(
    @Req() req: AuthRequest,
    @Param('id', uuidParam()) id: string,
    @Body() dto: StatusDto,
  ) {
    return this.orders.updateStatus(req.user, id, dto);
  }
}
