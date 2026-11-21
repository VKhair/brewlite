import { OrderInventoryService } from './order-inventory.service';
import { Prisma } from '../generated/prisma/client';

const productId = '10000000-0000-4000-8000-000000000001';
const toppingId = '20000000-0000-4000-8000-000000000001';
const item = {
  productId,
  productName: 'Cà phê sữa',
  sizeName: 'M',
  quantity: 2,
  toppings: [{ id: toppingId, name: 'Thạch cà phê' }],
};

describe('OrderInventoryService', () => {
  it('aggregates recipe requirements by ingredient and order quantity', async () => {
    const prisma = {
      productRecipe: {
        findMany: jest.fn().mockResolvedValue([
          {
            productId,
            size: 'M',
            ingredientId: 1,
            quantity: new Prisma.Decimal('2.500'),
          },
          {
            productId,
            size: 'M',
            ingredientId: 2,
            quantity: new Prisma.Decimal('1.000'),
          },
        ]),
      },
      toppingRecipe: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            {
              toppingId,
              ingredientId: 1,
              quantity: new Prisma.Decimal('0.250'),
            },
          ]),
      },
    };
    const service = new OrderInventoryService();
    const tx = {
      productRecipe: prisma.productRecipe,
      toppingRecipe: prisma.toppingRecipe,
    } as never;
    const needed = await service.collectOrderRequirements(tx, [item]);
    expect(needed.get(1)?.toString()).toBe('5.5');
    expect(needed.get(2)?.toString()).toBe('2');
  });

  it('rejects a size without a recipe', async () => {
    const tx = {
      productRecipe: { findMany: jest.fn().mockResolvedValue([]) },
    } as never;
    const service = new OrderInventoryService();
    await expect(
      service.collectOrderRequirements(tx, [{ ...item, toppings: [] }]),
    ).rejects.toMatchObject({
      response: { code: 'INGREDIENT_RECIPE_MISSING' },
    });
  });

  it('rejects a selected topping without a recipe', async () => {
    const tx = {
      productRecipe: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            {
              productId,
              size: 'M',
              ingredientId: 1,
              quantity: new Prisma.Decimal(1),
            },
          ]),
      },
      toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) },
    } as never;
    const service = new OrderInventoryService();
    await expect(
      service.collectOrderRequirements(tx, [item]),
    ).rejects.toMatchObject({
      response: { code: 'INGREDIENT_RECIPE_MISSING' },
    });
  });
});
