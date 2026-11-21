import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { uuidParam } from '../common/validation/uuid-param.pipe';
import {
  CreateIngredientDto,
  InventoryMovementDto,
  SetProductRecipeDto,
  SetToppingRecipeDto,
  UpdateIngredientDto,
} from './inventory.dto';
import { InventoryService } from './inventory.service';
import { InventoryRecipesService } from './inventory-recipes.service';

@Controller('inventory')
@UseGuards(JwtGuard, AdminGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly recipes: InventoryRecipesService,
  ) {}

  @Get('ingredients')
  listIngredients() {
    return this.inventoryService.listIngredients();
  }

  @Post('ingredients')
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(dto);
  }

  @Get('products/:productId/recipes')
  listProductRecipes(@Param('productId', uuidParam()) productId: string) {
    return this.recipes.listProductRecipes(productId);
  }

  @Get('toppings/recipes')
  listToppingRecipes() {
    return this.recipes.listToppingRecipes();
  }

  @Patch('ingredients/:id')
  updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Post('ingredients/:id/movements')
  recordMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: InventoryMovementDto,
  ) {
    return this.inventoryService.recordMovement(id, dto);
  }

  @Put('products/:productId/recipes/:size')
  setProductRecipe(
    @Param('productId', uuidParam()) productId: string,
    @Param('size') size: string,
    @Body() dto: SetProductRecipeDto,
  ) {
    return this.recipes.setProductRecipe(productId, size, dto);
  }

  @Put('toppings/:toppingId/recipe')
  setToppingRecipe(
    @Param('toppingId', uuidParam()) toppingId: string,
    @Body() dto: SetToppingRecipeDto,
  ) {
    return this.recipes.setToppingRecipe(toppingId, dto);
  }
}
