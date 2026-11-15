import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../admin.guard';
import { JwtGuard } from '../auth';
import { uuidParam } from '../validation';
import {
  CreateIngredientDto, InventoryMovementDto, SetProductRecipeDto, SetToppingRecipeDto, UpdateIngredientDto,
} from './inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtGuard, AdminGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  listIngredients() { return this.inventoryService.listIngredients(); }

  @Post('ingredients')
  createIngredient(@Body() dto: CreateIngredientDto) { return this.inventoryService.createIngredient(dto); }

  @Get('products/:productId/recipes')
  listProductRecipes(@Param('productId', uuidParam()) productId: string) {
    return this.inventoryService.listProductRecipes(productId);
  }

  @Get('toppings/recipes')
  listToppingRecipes() { return this.inventoryService.listToppingRecipes(); }

  @Patch('ingredients/:id')
  updateIngredient(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIngredientDto) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Post('ingredients/:id/movements')
  recordMovement(@Param('id', ParseIntPipe) id: number, @Body() dto: InventoryMovementDto) {
    return this.inventoryService.recordMovement(id, dto);
  }

  @Put('products/:productId/recipes/:size')
  setProductRecipe(
    @Param('productId', uuidParam()) productId: string,
    @Param('size') size: string,
    @Body() dto: SetProductRecipeDto,
  ) { return this.inventoryService.setProductRecipe(productId, size, dto); }

  @Put('toppings/:toppingId/recipe')
  setToppingRecipe(@Param('toppingId', uuidParam()) toppingId: string, @Body() dto: SetToppingRecipeDto) {
    return this.inventoryService.setToppingRecipe(toppingId, dto);
  }
}
