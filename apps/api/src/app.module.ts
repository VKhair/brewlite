import { Module } from '@nestjs/common';
import { Database } from './database';
import { ProductsController, ProductsService } from './products';

@Module({ controllers: [ProductsController], providers: [Database, ProductsService] })
export class AppModule {}
