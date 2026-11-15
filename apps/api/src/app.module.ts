import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController, AuthService, JwtGuard, jwtOptions } from './auth';
import { ProductsController, ProductsService } from './products';
import { OrdersController, OrdersService } from './orders';
import { PaymentsController, PaymentsService } from './payments';
import { ApiErrorFilter } from './api-error.filter';
import { createValidationPipe } from './validation';
import { createPaymentProvider, PAYMENT_PROVIDER } from './payment-provider';
import { PrismaModule } from './prisma/prisma.module';
import { CouponsController } from './coupons/coupons.controller';
import { CouponsService } from './coupons/coupons.service';
import { InventoryController } from './inventory/inventory.controller';
import { InventoryService } from './inventory/inventory.service';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: jwtOptions }), PrismaModule],
  controllers: [AppController, ProductsController, AuthController, OrdersController, PaymentsController, CouponsController, InventoryController],
  providers: [
    AppService, ProductsService, AuthService, JwtGuard, OrdersService, PaymentsService, CouponsService, InventoryService, AdminGuard,
    { provide: PAYMENT_PROVIDER, useFactory: createPaymentProvider },
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiErrorFilter },
  ],
})
export class AppModule {}
