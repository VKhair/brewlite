import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Database } from './database';
import { ProductsController, ProductsService } from './products';
import { AuthController, AuthService, JwtGuard, jwtOptions } from './auth';
import { OrdersController, OrdersService } from './orders';
import { PaymentsController, PaymentsService } from './payments';
import { createValidationPipe } from './validation';
import { ApiErrorFilter } from './api-error.filter';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
  controllers: [ProductsController, AuthController, OrdersController, PaymentsController],
  providers: [Database, ProductsService, AuthService, JwtGuard, OrdersService, PaymentsService,
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiErrorFilter }],
})
export class AppModule {}
