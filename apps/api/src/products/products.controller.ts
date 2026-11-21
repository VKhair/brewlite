import { Controller, Get, Param } from '@nestjs/common';
import { uuidParam } from '../common/validation/uuid-param.pipe';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  findAll() {
    return this.products.findAll();
  }

  @Get(':id')
  findOne(@Param('id', uuidParam()) id: string) {
    return this.products.findOne(id);
  }
}
