import { Product } from '../../domain/product.entity';

export const PRODUCT_REPOSITORY_PORT = Symbol('PRODUCT_REPOSITORY_PORT');

export interface ProductRepositoryPort {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  decrementStockAtomic(productId: string, quantity: number): Promise<boolean>;
  incrementStock(productId: string, quantity: number): Promise<void>;
  save(product: Product): Promise<void>;
}
