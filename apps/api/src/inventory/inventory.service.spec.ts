import { InventoryService } from './inventory.service';
import { Prisma } from '../generated/prisma/client';

describe('InventoryService', () => {
  it('aggregates recipe requirements by ingredient and order quantity', async () => {
    const prisma = {
      productRecipe: { findMany: jest.fn().mockResolvedValue([
        { ingredientId: 1, quantity: new Prisma.Decimal('2.500') }, { ingredientId: 2, quantity: new Prisma.Decimal('1.000') },
      ]) },
      toppingRecipe: { findMany: jest.fn().mockResolvedValue([{ ingredientId: 1, quantity: new Prisma.Decimal('0.250') }]) },
    };
    const service = new InventoryService(prisma as never);
    const tx = {
      productRecipe: prisma.productRecipe,
      toppingRecipe: prisma.toppingRecipe,
    } as never;
    const needed = await service.collectOrderRequirements(tx, [{ productId: '10000000-0000-4000-8000-000000000001',
      sizeName: 'M', quantity: 2, toppings: [{ id: '20000000-0000-4000-8000-000000000001' }] }]);
    expect(needed.get(1)?.toString()).toBe('5.5');
    expect(needed.get(2)?.toString()).toBe('2');
  });

  it('leaves legacy products sellable when no ingredient recipe exists', async () => {
    const prisma = { productRecipe: { findMany: jest.fn().mockResolvedValue([]) }, toppingRecipe: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new InventoryService(prisma as never);
    const result = await service.collectOrderRequirements(prisma as never, [{ productId: '10000000-0000-4000-8000-000000000001', sizeName: 'M', quantity: 1, toppings: [] }]);
    expect(result.size).toBe(0);
  });
});
