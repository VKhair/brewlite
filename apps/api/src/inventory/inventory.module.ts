import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { AdminGuard } from '../admin.guard';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard, jwtOptions } from '../auth';

@Module({
  imports: [PrismaModule, JwtModule.registerAsync({ useFactory: jwtOptions })],
  controllers: [InventoryController],
  providers: [InventoryService, AdminGuard, JwtGuard],
  exports: [InventoryService],
})
export class InventoryModule {}
