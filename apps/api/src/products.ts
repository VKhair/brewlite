import { Controller, Get, Injectable, NotFoundException, Param } from '@nestjs/common';
import { Database } from './database';
import { uuidParam } from './validation';

@Injectable()
export class ProductsService {
  constructor(private readonly db: Database) {}

  async findAll() {
    const products = await this.db.product.findMany({
      where: { isAvailable: true }, orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return products.map(({ stock: _stock, ...product }) => product);
  }

  async findOne(id: string) {
    const product = await this.db.product.findFirst({
      where: { id, isAvailable: true },
      include: {
        sizes: { orderBy: [{ priceDelta: 'asc' }, { id: 'asc' }] },
        toppings: { include: { topping: true } },
      },
    });
    if (!product) throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    const { sizes, toppings, stock: _stock, ...info } = product;
    return {
      ...info,
      sizes: sizes.map(({ productId: _productId, ...size }) => size),
      toppings: toppings.map(({ topping }) => ({ id: topping.id, name: topping.name,
        price: topping.price, isAvailable: topping.isAvailable }))
        .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    };
  }
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() findAll() { return this.products.findAll(); }
  @Get(':id') findOne(@Param('id', uuidParam()) id: string) { return this.products.findOne(id); }
}
