import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto, InventoryMovementDto, SetProductRecipeDto, UpdateIngredientDto } from './inventory.dto';

export type RecipeOrderLine = { productId: string; sizeName: string; quantity: number; toppings: { id: string }[] };
type Tx = Prisma.TransactionClient;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listIngredients() {
    const rows = await this.prisma.ingredient.findMany({ include: { movements: { orderBy: { createdAt: 'desc' }, take: 50 } }, orderBy: { name: 'asc' } });
    return rows.map(i => ({ ...i, onHand: Number(i.onHand), movements: i.movements.map(m => ({ ...m, quantity: Number(m.quantity) })) }));
  }
  async createIngredient(dto: CreateIngredientDto) {
    return this.prisma.$transaction(async tx => {
      const amount = new Prisma.Decimal(dto.openingStock ?? 0);
      const row = await tx.ingredient.create({ data: { name: dto.name.trim(), unit: dto.unit.trim(), onHand: amount } });
      if (amount.gt(0)) await tx.inventoryMovement.create({ data: { ingredientId: row.id, type: 'OPENING', quantity: amount, reason: 'Tồn đầu kỳ' } });
      return { ...row, onHand: Number(row.onHand) };
    });
  }
  async updateIngredient(id: number, dto: UpdateIngredientDto) {
    const row = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy nguyên liệu');
    if (dto.unit && dto.unit.trim() !== row.unit) {
      const count = await this.prisma.productRecipe.count({ where: { ingredientId: id } }) +
        await this.prisma.toppingRecipe.count({ where: { ingredientId: id } }) +
        await this.prisma.inventoryMovement.count({ where: { ingredientId: id } });
      if (count) throw new BadRequestException('Không thể đổi đơn vị sau khi nguyên liệu đã có công thức hoặc lịch sử kho');
    }
    const updated = await this.prisma.ingredient.update({ where: { id }, data: {
      ...(dto.name ? { name: dto.name.trim() } : {}), ...(dto.unit ? { unit: dto.unit.trim() } : {}),
    } });
    return { ...updated, onHand: Number(updated.onHand) };
  }
  async recordMovement(id: number, dto: InventoryMovementDto) {
    if (!dto.quantity || (dto.type === 'RECEIPT' && dto.quantity < 0)) throw new BadRequestException('Số lượng biến động kho không hợp lệ');
    return this.prisma.$transaction(async tx => {
      const amount = new Prisma.Decimal(dto.quantity);
      const result = await tx.ingredient.updateMany({ where: { id, onHand: { gte: amount.lt(0) ? amount.abs() : 0 } }, data: { onHand: { increment: amount } } });
      if (!result.count) throw new BadRequestException('Không tìm thấy nguyên liệu hoặc tồn kho không đủ');
      const movement = await tx.inventoryMovement.create({ data: { ingredientId: id, type: dto.type, quantity: amount, reason: dto.reason.trim() } });
      const ingredient = await tx.ingredient.findUniqueOrThrow({ where: { id } });
      return { ...ingredient, onHand: Number(ingredient.onHand), movement: { ...movement, quantity: Number(movement.quantity) } };
    });
  }
  async listProductRecipes(productId: string) {
    if (!await this.prisma.product.findUnique({ where: { id: productId } })) throw new NotFoundException('Không tìm thấy sản phẩm');
    const rows = await this.prisma.productRecipe.findMany({ where: { productId }, include: { ingredient: true }, orderBy: [{ size: 'asc' }, { ingredientId: 'asc' }] });
    return rows.map(r => ({ ...r, quantity: Number(r.quantity), ingredient: { ...r.ingredient, onHand: Number(r.ingredient.onHand) } }));
  }
  async listToppingRecipes() {
    const rows = await this.prisma.toppingRecipe.findMany({ include: { topping: true, ingredient: true }, orderBy: [{ toppingId: 'asc' }, { ingredientId: 'asc' }] });
    return rows.map(r => ({ ...r, quantity: Number(r.quantity), ingredient: { ...r.ingredient, onHand: Number(r.ingredient.onHand) } }));
  }
  async setProductRecipe(productId: string, size: string, dto: SetProductRecipeDto) {
    return this.prisma.$transaction(async tx => {
      if (!await tx.product.findUnique({ where: { id: productId } })) throw new NotFoundException('Không tìm thấy sản phẩm');
      await tx.productRecipe.deleteMany({ where: { productId, size } });
      await tx.productRecipe.createMany({ data: dto.ingredients.map(line => ({ productId, size, ingredientId: line.ingredientId, quantity: new Prisma.Decimal(line.quantity) })) });
      const rows = await tx.productRecipe.findMany({ where: { productId }, include: { ingredient: true }, orderBy: [{ size: 'asc' }, { ingredientId: 'asc' }] });
      return rows.map(r => ({ ...r, quantity: Number(r.quantity), ingredient: { ...r.ingredient, onHand: Number(r.ingredient.onHand) } }));
    });
  }
  async setToppingRecipe(toppingId: string, dto: SetProductRecipeDto) {
    return this.prisma.$transaction(async tx => {
      if (!await tx.topping.findUnique({ where: { id: toppingId } })) throw new NotFoundException('Không tìm thấy topping');
      await tx.toppingRecipe.deleteMany({ where: { toppingId } });
      await tx.toppingRecipe.createMany({ data: dto.ingredients.map(line => ({ toppingId, ingredientId: line.ingredientId, quantity: new Prisma.Decimal(line.quantity) })) });
      return tx.toppingRecipe.findMany({ where: { toppingId }, include: { ingredient: true } });
    });
  }

  async collectOrderRequirements(tx: Tx, items: RecipeOrderLine[]) {
    const required = new Map<number, Prisma.Decimal>();
    const add = (ingredientId: number, amount: Prisma.Decimal, quantity: number) => {
      required.set(ingredientId, (required.get(ingredientId) ?? new Prisma.Decimal(0)).plus(amount.mul(quantity)));
    };
    for (const item of items) {
      const recipe = await tx.productRecipe.findMany({ where: { productId: item.productId, size: item.sizeName } });
      // Existing MVP products keep their product-level stock until an operator
      // configures a recipe; configured recipes are consumed transactionally.
      for (const line of recipe) add(line.ingredientId, line.quantity, item.quantity);
      for (const topping of item.toppings) {
        const toppingRecipe = await tx.toppingRecipe.findMany({ where: { toppingId: topping.id } });
        for (const line of toppingRecipe) add(line.ingredientId, line.quantity, item.quantity);
      }
    }
    return required;
  }
  async consume(tx: Tx, orderId: string, required: Map<number, Prisma.Decimal>) {
    for (const [ingredientId, amount] of [...required].sort(([a], [b]) => a - b)) {
      const changed = await tx.ingredient.updateMany({ where: { id: ingredientId, onHand: { gte: amount } }, data: { onHand: { decrement: amount } } });
      if (!changed.count) throw new BadRequestException('Không đủ nguyên liệu để tạo đơn hàng');
      await tx.inventoryMovement.create({ data: { ingredientId, orderId, type: 'CONSUMPTION', quantity: amount.negated(), reason: `Tiêu hao đơn hàng ${orderId}` } });
    }
  }
  async reverseOrderConsumption(tx: Tx, orderId: string) {
    const consumed = await tx.inventoryMovement.findMany({ where: { orderId, type: 'CONSUMPTION' } });
    for (const movement of consumed) {
      const exists = await tx.inventoryMovement.findFirst({ where: { orderId, ingredientId: movement.ingredientId, type: 'REVERSAL' } });
      if (exists) continue;
      const amount = movement.quantity.abs();
      await tx.ingredient.update({ where: { id: movement.ingredientId }, data: { onHand: { increment: amount } } });
      await tx.inventoryMovement.create({ data: { ingredientId: movement.ingredientId, orderId, type: 'REVERSAL', quantity: amount, reason: `Hoàn nguyên liệu đơn hàng ${orderId}` } });
    }
  }
}
