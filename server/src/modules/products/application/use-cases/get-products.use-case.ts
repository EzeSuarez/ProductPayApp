import { Injectable, Inject, Logger } from '@nestjs/common';
import { Result } from '../../../../common/domain/result';
import { Product } from '../../domain/product.entity';
import {
  PRODUCT_REPOSITORY_PORT,
  ProductRepositoryPort,
} from '../ports/product.repository.port';

export interface ProductResponseDto {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrl: string;
}

@Injectable()
export class GetProductsUseCase {
  private readonly logger = new Logger(GetProductsUseCase.name);

  // In-memory catalog cache with 60s TTL
  private cachedProducts: ProductResponseDto[] | null = null;
  private cacheExpiresAt = 0;
  private readonly TTL_MS = 60_000;

  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(): Promise<Result<ProductResponseDto[]>> {
    const now = Date.now();
    if (this.cachedProducts && now < this.cacheExpiresAt) {
      this.logger.debug('Serving catalog from cache');
      return Result.ok(this.cachedProducts);
    }

    const products = await this.productRepository.findAll();
    const dtos: ProductResponseDto[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceInCents: p.priceInCents,
      stock: p.stock,
      imageUrl: p.imageUrl,
    }));

    this.cachedProducts = dtos;
    this.cacheExpiresAt = now + this.TTL_MS;
    this.logger.debug(`Loaded ${dtos.length} products from repository into cache`);

    return Result.ok(dtos);
  }

  invalidateCache(): void {
    this.cachedProducts = null;
    this.cacheExpiresAt = 0;
    this.logger.debug('Catalog cache invalidated');
  }
}
