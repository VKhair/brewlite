import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRecipesService } from './inventory-recipes.service';
import { OrderInventoryService } from './order-inventory.service';

@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryRecipesService, OrderInventoryService],
  exports: [OrderInventoryService],
})
export class InventoryModule {}
