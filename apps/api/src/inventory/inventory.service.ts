import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateIngredientDto,
  InventoryMovementDto,
  UpdateIngredientDto,
} from './inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listIngredients() {
    const rows = await this.prisma.ingredient.findMany({
      include: { movements: { orderBy: { createdAt: 'desc' }, take: 50 } },
      orderBy: { name: 'asc' },
    });
    return rows.map((i) => ({
      ...i,
      onHand: Number(i.onHand),
      movements: i.movements.map((m) => ({
        ...m,
        quantity: Number(m.quantity),
      })),
    }));
  }
  async createIngredient(dto: CreateIngredientDto) {
    return this.prisma.$transaction(async (tx) => {
      const amount = new Prisma.Decimal(dto.openingStock ?? 0);
      const row = await tx.ingredient.create({
        data: { name: dto.name.trim(), unit: dto.unit.trim(), onHand: amount },
      });
      if (amount.gt(0))
        await tx.inventoryMovement.create({
          data: {
            ingredientId: row.id,
            type: 'OPENING',
            quantity: amount,
            reason: 'Tồn đầu kỳ',
          },
        });
      return { ...row, onHand: Number(row.onHand) };
    });
  }
  async updateIngredient(id: number, dto: UpdateIngredientDto) {
    const row = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Không tìm thấy nguyên liệu');
    if (dto.unit && dto.unit.trim() !== row.unit) {
      const count =
        (await this.prisma.productRecipe.count({
          where: { ingredientId: id },
        })) +
        (await this.prisma.toppingRecipe.count({
          where: { ingredientId: id },
        })) +
        (await this.prisma.inventoryMovement.count({
          where: { ingredientId: id },
        }));
      if (count)
        throw new BadRequestException(
          'Không thể đổi đơn vị sau khi nguyên liệu đã có công thức hoặc lịch sử kho',
        );
    }
    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.unit ? { unit: dto.unit.trim() } : {}),
      },
    });
    return { ...updated, onHand: Number(updated.onHand) };
  }
  async recordMovement(id: number, dto: InventoryMovementDto) {
    if (!dto.quantity || (dto.type === 'RECEIPT' && dto.quantity < 0))
      throw new BadRequestException('Số lượng biến động kho không hợp lệ');
    return this.prisma.$transaction(async (tx) => {
      const amount = new Prisma.Decimal(dto.quantity);
      const result = await tx.ingredient.updateMany({
        where: { id, onHand: { gte: amount.lt(0) ? amount.abs() : 0 } },
        data: { onHand: { increment: amount } },
      });
      if (!result.count)
        throw new BadRequestException(
          'Không tìm thấy nguyên liệu hoặc tồn kho không đủ',
        );
      const movement = await tx.inventoryMovement.create({
        data: {
          ingredientId: id,
          type: dto.type,
          quantity: amount,
          reason: dto.reason.trim(),
        },
      });
      const ingredient = await tx.ingredient.findUniqueOrThrow({
        where: { id },
      });
      return {
        ...ingredient,
        onHand: Number(ingredient.onHand),
        movement: { ...movement, quantity: Number(movement.quantity) },
      };
    });
  }
}
