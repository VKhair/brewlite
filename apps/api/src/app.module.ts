import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController, AuthService, JwtGuard, jwtOptions } from './auth';
import { Database } from './database';
import { ProductsController, ProductsService } from './products';
import { OrdersController, OrdersService } from './orders';
import { PaymentsController, PaymentsService } from './payments';
import { ApiErrorFilter } from './api-error.filter';
import { createValidationPipe } from './validation';

@Module({
  imports: [JwtModule.registerAsync({ useFactory: jwtOptions })],
  controllers: [AppController, ProductsController, AuthController, OrdersController, PaymentsController],
  providers: [
    AppService, Database, ProductsService, AuthService, JwtGuard, OrdersService, PaymentsService,
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: ApiErrorFilter },
  ],
})
export class AppModule {}
