import { IsIn, IsUUID, ValidateIf } from 'class-validator';

export class PaymentDto {
  @IsUUID() orderId!: string;
  @IsIn(['EWALLET', 'CARD', 'VNPAY']) paymentMethod!:
    'EWALLET' | 'CARD' | 'VNPAY';
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(['SUCCESS', 'FAILURE'])
  mockOutcome?: 'SUCCESS' | 'FAILURE';
}
