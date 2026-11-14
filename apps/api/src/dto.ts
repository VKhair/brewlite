import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsEmail, IsIn, IsInt,
  IsObject, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { MaxUtf8Bytes } from './validation';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const email = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @IsString() @Length(6, 72) @MaxUtf8Bytes(72) password!: string;
}
export class RegisterDto {
  @Transform(email) @IsEmail() @MaxLength(254) email!: string;
  @IsString() @Length(6, 72) @MaxUtf8Bytes(72)
  @Matches(/^(?=.*\p{L})(?=.*\d)[\s\S]+$/u, { message: 'password must contain letters and digits' })
  password!: string;
  @Transform(trim) @IsString() @Length(2, 50) @Matches(/^(?=.*\p{L})[\p{L}\p{M} .'-]+$/u) fullName!: string;
  @ValidateIf((_object, value) => value !== undefined) @IsString() @Matches(/^0[35789]\d{8}$/) phone?: string;
}
export class OrderItemDto {
  @IsUUID() productId!: string;
  // Sprint 1 seed uses md5::uuid IDs, whose version bits are arbitrary.
  @ValidateIf((_object, value) => value !== undefined) @IsString() @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) sizeId?: string;
  @IsInt() @Min(1) @Max(99) quantity!: number;
  @ValidateIf((_object, value) => value !== undefined) @IsArray() @ArrayMaxSize(20) @ArrayUnique() @IsUUID('all', { each: true }) toppingIds?: string[];
}
export class CreateOrderDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @IsObject({ each: true }) @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
export class PaymentDto {
  @IsUUID() orderId!: string;
  @IsIn(['EWALLET', 'CARD']) paymentMethod!: 'EWALLET' | 'CARD';
  @IsIn(['SUCCESS', 'FAILURE']) mockOutcome!: 'SUCCESS' | 'FAILURE';
}
export class StatusDto {
  @IsIn(['PREPARING', 'READY', 'COMPLETED']) status!: 'PREPARING' | 'READY' | 'COMPLETED';
}
