import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CouponsModule } from '../coupons/coupons.module';
import { OrderLoyaltyService } from './order-loyalty.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, CouponsModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderLoyaltyService],
  exports: [OrdersService],
})
export class OrdersModule {}
