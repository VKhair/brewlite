import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsUUID() productId!: string;
  // Sprint 1 seed uses md5::uuid IDs, whose version bits are arbitrary.
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  sizeId?: string;
  @IsInt() @Min(1) @Max(99) quantity!: number;
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  toppingIds?: string[];
}
export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @MaxLength(32)
  couponCode?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(0)
  @Max(100000)
  pointsUsed?: number;
}
export class StatusDto {
  @IsIn(['PREPARING', 'READY', 'COMPLETED']) status!:
    'PREPARING' | 'READY' | 'COMPLETED';
}
