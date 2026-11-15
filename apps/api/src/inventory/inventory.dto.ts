import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsIn,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIngredientDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() unit!: string;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) @IsOptional() openingStock?: number;
}

export class UpdateIngredientDto {
  @IsString() @IsNotEmpty() @IsOptional() name?: string;
  @IsString() @IsNotEmpty() @IsOptional() unit?: string;
}

export class InventoryMovementDto {
  @IsIn(['RECEIPT', 'ADJUSTMENT']) type!: 'RECEIPT' | 'ADJUSTMENT';
  @IsNumber({ maxDecimalPlaces: 3 }) quantity!: number;
  @IsString() @IsNotEmpty() reason!: string;
}

export class RecipeLineDto {
  @IsInt() @Min(1) ingredientId!: number;
  @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) quantity!: number;
}

export class SetProductRecipeDto {
  @IsArray() @ArrayNotEmpty() @ValidateNested({ each: true }) @Type(() => RecipeLineDto)
  ingredients!: RecipeLineDto[];
}

export class SetToppingRecipeDto extends SetProductRecipeDto {}
