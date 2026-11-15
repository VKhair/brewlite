import { Controller, Get, Injectable, NotFoundException, Param } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { uuidParam } from './validation';

@Injectable()
export class ProductsService {
  constructor(private readonly db: PrismaService) {}

  async findAll() {
    return (await this.db.product.findMany({ where: { isAvailable: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }] }))
      .map(product => ({ id: product.id, name: product.name, description: product.description,
        basePrice: product.basePrice, imageUrl: product.imageUrl, category: product.category, isAvailable: product.isAvailable }));
  }

  async findOne(id: string) {
    const product = await this.db.product.findFirst({ where: { id, isAvailable: true }, include: {
      sizes: { orderBy: [{ priceDelta: 'asc' }, { id: 'asc' }] },
      toppings: { include: { topping: true }, orderBy: [{ topping: { name: 'asc' } }, { toppingId: 'asc' }] },
    } });
    if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    return { id: product.id, name: product.name, description: product.description,
      basePrice: product.basePrice, imageUrl: product.imageUrl, category: product.category, isAvailable: product.isAvailable,
      sizes: product.sizes.map(s => ({ id: s.id, name: s.name, priceDelta: s.priceDelta, isDefault: s.isDefault })),
      toppings: product.toppings.map(({ topping }) => ({ id: topping.id, name: topping.name, price: topping.price, isAvailable: topping.isAvailable })) };
  }
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll() { return this.products.findAll(); }

  @Get(':id')
  findOne(@Param('id', uuidParam()) id: string) {
    return this.products.findOne(id);
  }
}
