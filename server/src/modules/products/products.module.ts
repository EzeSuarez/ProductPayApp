import { Module } from '@nestjs/common';
import { ProductsController } from './infrastructure/controllers/products.controller';
import { GetProductsUseCase } from './application/use-cases/get-products.use-case';
import { PRODUCT_REPOSITORY_PORT } from './application/ports/product.repository.port';
import { PostgresProductRepository } from './infrastructure/adapters/postgres-product.repository';

@Module({
  controllers: [ProductsController],
  providers: [
    GetProductsUseCase,
    {
      provide: PRODUCT_REPOSITORY_PORT,
      useClass: PostgresProductRepository,
    },
  ],
  exports: [PRODUCT_REPOSITORY_PORT, GetProductsUseCase],
})
export class ProductsModule {}
