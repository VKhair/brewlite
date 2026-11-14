import { Controller, Get, Injectable, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { Database } from './database';

const fields = `id, name, description, base_price AS "basePrice",
  image_url AS "imageUrl", category, is_available AS "isAvailable"`;

@Injectable()
export class ProductsService {
  constructor(private readonly db: Database) {}

  async findAll() {
    const result = await this.db.query(`SELECT ${fields} FROM products
      WHERE is_available = true ORDER BY name, id`);
    return result.rows;
  }

  async findOne(id: string) {
    const result = await this.db.query(`SELECT ${fields},
      COALESCE((SELECT json_agg(s ORDER BY s."priceDelta", s.id) FROM
        (SELECT id, name, price_delta AS "priceDelta", is_default AS "isDefault"
         FROM product_sizes WHERE product_id = p.id) s), '[]'::json) AS sizes,
      COALESCE((SELECT json_agg(t ORDER BY t.name, t.id) FROM
        (SELECT t.id, t.name, t.price, t.is_available AS "isAvailable"
         FROM toppings t JOIN product_toppings pt ON pt.topping_id = t.id
         WHERE pt.product_id = p.id) t), '[]'::json) AS toppings
      FROM products p WHERE id = $1 AND is_available = true`, [id]);
    if (!result.rows[0]) throw new NotFoundException('Product not found');
    return result.rows[0];
  }
}

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll() { return this.products.findAll(); }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.products.findOne(id);
  }
}
