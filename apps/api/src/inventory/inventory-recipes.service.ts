import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SetProductRecipeDto } from './inventory.dto';

@Injectable()
export class InventoryRecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async listProductRecipes(productId: string) {
    if (!(await this.prisma.product.findUnique({ where: { id: productId } })))
      throw new NotFoundException('Không tìm thấy sản phẩm');
    const rows = await this.prisma.productRecipe.findMany({
      where: { productId },
      include: { ingredient: true },
      orderBy: [{ size: 'asc' }, { ingredientId: 'asc' }],
    });
    return rows.map((r) => ({
      ...r,
      quantity: Number(r.quantity),
      ingredient: { ...r.ingredient, onHand: Number(r.ingredient.onHand) },
    }));
  }
  async listToppingRecipes() {
    const rows = await this.prisma.toppingRecipe.findMany({
      include: { topping: true, ingredient: true },
      orderBy: [{ toppingId: 'asc' }, { ingredientId: 'asc' }],
    });
    return rows.map((r) => ({
      ...r,
      quantity: Number(r.quantity),
      ingredient: { ...r.ingredient, onHand: Number(r.ingredient.onHand) },
    }));
  }
  async setProductRecipe(
    productId: string,
    size: string,
    dto: SetProductRecipeDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (!(await tx.product.findUnique({ where: { id: productId } })))
        throw new NotFoundException('Không tìm thấy sản phẩm');
      await tx.productRecipe.deleteMany({ where: { productId, size } });
      await tx.productRecipe.createMany({
        data: dto.ingredients.map((line) => ({
          productId,
          size,
          ingredientId: line.ingredientId,
          quantity: new Prisma.Decimal(line.quantity),
        })),
      });
      const rows = await tx.productRecipe.findMany({
        where: { productId },
        include: { ingredient: true },
        orderBy: [{ size: 'asc' }, { ingredientId: 'asc' }],
      });
      return rows.map((r) => ({
        ...r,
        quantity: Number(r.quantity),
        ingredient: { ...r.ingredient, onHand: Number(r.ingredient.onHand) },
      }));
    });
  }
  async setToppingRecipe(toppingId: string, dto: SetProductRecipeDto) {
    return this.prisma.$transaction(async (tx) => {
      if (!(await tx.topping.findUnique({ where: { id: toppingId } })))
        throw new NotFoundException('Không tìm thấy topping');
      await tx.toppingRecipe.deleteMany({ where: { toppingId } });
      await tx.toppingRecipe.createMany({
        data: dto.ingredients.map((line) => ({
          toppingId,
          ingredientId: line.ingredientId,
          quantity: new Prisma.Decimal(line.quantity),
        })),
      });
      return tx.toppingRecipe.findMany({
        where: { toppingId },
        include: { ingredient: true },
      });
    });
  }
}
