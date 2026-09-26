import { GetProductsUseCase } from './get-products.use-case';
import { ProductRepositoryPort } from '../ports/product.repository.port';
import { Product } from '../../domain/product.entity';

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let mockRepo: jest.Mocked<ProductRepositoryPort>;

  const mockProduct = new Product({
    id: 'p1',
    name: 'Test Product',
    description: 'Test Description',
    priceInCents: 5000000,
    stock: 10,
    imageUrl: 'https://example.com/img.png',
  });

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn().mockResolvedValue([mockProduct]),
      findById: jest.fn(),
      decrementStockAtomic: jest.fn(),
      incrementStock: jest.fn(),
      save: jest.fn(),
    };
    useCase = new GetProductsUseCase(mockRepo);
  });

  it('should return mapped products on first execution', async () => {
    const result = await useCase.execute();

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toEqual({
        id: 'p1',
        name: 'Test Product',
        description: 'Test Description',
        priceInCents: 5000000,
        stock: 10,
        imageUrl: 'https://example.com/img.png',
      });
    }
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('should serve subsequent calls from cache within TTL', async () => {
    await useCase.execute();
    await useCase.execute();

    // mockRepo.findAll should still only have been called once
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('should reload from repository after cache invalidation', async () => {
    await useCase.execute();
    useCase.invalidateCache();
    await useCase.execute();

    expect(mockRepo.findAll).toHaveBeenCalledTimes(2);
  });
});
