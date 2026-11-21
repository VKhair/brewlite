import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module';
import { AuthModule } from '../auth/auth.module';
import { CouponsModule } from '../coupons/coupons.module';
import { OrderLoyaltyService } from './order-loyalty.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [AuthModule, CouponsModule, InventoryModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderLoyaltyService],
  exports: [OrdersService],
})
export class OrdersModule {}
