import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PAYMENT_PROVIDER } from './providers/payment-provider';
import { createPaymentProvider } from './providers/payment-provider.factory';
import { VnpayCallbackController } from './vnpay-callback.controller';
import { VnpayCallbackService } from './vnpay-callback.service';

@Module({
  imports: [AuthModule, OrdersModule, InventoryModule],
  controllers: [PaymentsController, VnpayCallbackController],
  providers: [
    PaymentsService,
    VnpayCallbackService,
    { provide: PAYMENT_PROVIDER, useFactory: createPaymentProvider },
  ],
})
export class PaymentsModule {}
