import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

export type RecipeOrderLine = {
  productId: string;
  productName: string;
  sizeName: string;
  quantity: number;
  toppings: { id: string; name: string }[];
};

type Tx = Prisma.TransactionClient;
type Requirements = Map<number, Prisma.Decimal>;
type RecipeLine = { ingredientId: number; quantity: Prisma.Decimal };

function groupRecipes<T extends RecipeLine>(
  rows: T[],
  keyFor: (row: T) => string,
) {
  const groups = new Map<string, RecipeLine[]>();
  for (const row of rows) {
    const key = keyFor(row);
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

function missingRecipe(message: string): never {
  throw new ConflictException({ code: 'INGREDIENT_RECIPE_MISSING', message });
}

@Injectable()
export class OrderInventoryService {
  async collectOrderRequirements(tx: Tx, items: RecipeOrderLine[]) {
    const products = new Map<string, { productId: string; size: string }>();
    const toppingIds = new Set<string>();
    for (const item of items) {
      products.set(item.productId + ':' + item.sizeName, {
        productId: item.productId,
        size: item.sizeName,
      });
      for (const topping of item.toppings) toppingIds.add(topping.id);
    }

    const productRows = await tx.productRecipe.findMany({
      where: { OR: [...products.values()] },
    });
    const toppingRows = toppingIds.size
      ? await tx.toppingRecipe.findMany({
          where: { toppingId: { in: [...toppingIds] } },
        })
      : [];
    const productRecipes = groupRecipes(
      productRows,
      (row) => row.productId + ':' + row.size,
    );
    const toppingRecipes = groupRecipes(toppingRows, (row) => row.toppingId);

    const required: Requirements = new Map();
    function add(recipe: RecipeLine[], quantity: number) {
      for (const { ingredientId, quantity: amount } of recipe) {
        const total = required.get(ingredientId) ?? new Prisma.Decimal(0);
        required.set(ingredientId, total.plus(amount.mul(quantity)));
      }
    }

    for (const item of items) {
      const recipe = productRecipes.get(item.productId + ':' + item.sizeName);
      if (!recipe)
        missingRecipe(
          'Món ' +
            item.productName +
            ' size ' +
            item.sizeName +
            ' chưa có công thức nguyên liệu.',
        );
      add(recipe, item.quantity);
      for (const topping of item.toppings) {
        const recipe = toppingRecipes.get(topping.id);
        if (!recipe)
          missingRecipe(
            'Topping ' + topping.name + ' chưa có công thức nguyên liệu.',
          );
        add(recipe, item.quantity);
      }
    }
    return required;
  }

  async reserve(tx: Tx, required: Requirements) {
    // PostgreSQL rechecks the condition after waiting on a concurrent row update.
    // A shortage rolls back the entire payment transaction, including earlier rows.
    for (const [ingredientId, amount] of [...required].sort(
      ([a], [b]) => a - b,
    )) {
      const changed = await tx.ingredient.updateMany({
        where: { id: ingredientId, onHand: { gte: amount } },
        data: { onHand: { decrement: amount } },
      });
      if (!changed.count) {
        throw new ConflictException({
          code: 'INSUFFICIENT_INGREDIENT_STOCK',
          message:
            'Không đủ nguyên liệu để thanh toán đơn hàng. Vui lòng điều chỉnh giỏ hàng hoặc thử lại sau.',
        });
      }
    }
  }

  async recordConsumption(
    tx: Tx,
    orderId: string,
    paymentId: string,
    required: Requirements,
  ) {
    await tx.inventoryMovement.createMany({
      data: [...required].map(([ingredientId, amount]) => ({
        ingredientId,
        orderId,
        paymentId,
        type: 'CONSUMPTION',
        quantity: amount.negated(),
        reason: 'Tiêu hao đơn hàng ' + orderId,
      })),
    });
  }

  async reversePaymentConsumption(tx: Tx, paymentId: string) {
    const consumed = await tx.inventoryMovement.findMany({
      where: { paymentId, type: 'CONSUMPTION' },
      orderBy: { ingredientId: 'asc' },
    });
    for (const movement of consumed) {
      const amount = movement.quantity.abs();
      const reversal = await tx.inventoryMovement.createMany({
        data: {
          ingredientId: movement.ingredientId,
          orderId: movement.orderId,
          paymentId,
          type: 'REVERSAL',
          quantity: amount,
          reason: 'Hoàn nguyên liệu đơn hàng ' + movement.orderId,
        },
        skipDuplicates: true,
      });
      if (reversal.count) {
        await tx.ingredient.update({
          where: { id: movement.ingredientId },
          data: { onHand: { increment: amount } },
        });
      }
    }
  }
}
