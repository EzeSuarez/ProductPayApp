import { PostgresProductRepository } from './postgres-product.repository';
import { DatabaseService } from '../../../../database/database.service';
import { Product } from '../../domain/product.entity';

describe('PostgresProductRepository', () => {
  let repository: PostgresProductRepository;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
    } as any;

    repository = new PostgresProductRepository(mockDb);
  });

  describe('findAll', () => {
    it('should query database and map rows when database returns records', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'p1',
            name: 'DB Product',
            description: 'Desc',
            price_in_cents: '10000',
            stock: '5',
            image_url: 'https://example.com/p1.jpg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      } as any);

      const products = await repository.findAll();
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('DB Product');
      expect(products[0].priceInCents).toBe(10000);
      expect(products[0].stock).toBe(5);
    });

    it('should return in-memory seed products when database throws or is unavailable', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Connection refused'));

      const products = await repository.findAll();
      expect(products.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('findById', () => {
    it('should return product from db when found', async () => {
      mockDb.query.mockResolvedValueOnce({
        rows: [
          {
            id: 'p1',
            name: 'Product 1',
            description: 'Desc',
            price_in_cents: '5000',
            stock: '10',
            image_url: 'https://example.com/p1.jpg',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      } as any);

      const product = await repository.findById('p1');
      expect(product).not.toBeNull();
      expect(product?.id).toBe('p1');
    });

    it('should fallback to in-memory store when DB query fails', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Error'));

      const product = await repository.findById('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d');
      expect(product).not.toBeNull();
      expect(product?.name).toContain('Sony WH-1000XM5');
    });
  });

  describe('decrementStockAtomic', () => {
    it('should return true when atomic update succeeds in DB', async () => {
      mockDb.query.mockResolvedValueOnce({ rowCount: 1 } as any);

      const success = await repository.decrementStockAtomic('p1', 1);
      expect(success).toBe(true);
    });

    it('should update in-memory store when DB is offline', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('DB Error'));

      const pId = 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d';
      const initial = (await repository.findById(pId))?.stock || 0;

      const success = await repository.decrementStockAtomic(pId, 2);
      expect(success).toBe(true);

      const updated = await repository.findById(pId);
      expect(updated?.stock).toBe(initial - 2);
    });
  });

  describe('incrementStock', () => {
    it('should execute query or update in-memory stock', async () => {
      mockDb.query.mockResolvedValueOnce({ rowCount: 1 } as any);
      await repository.incrementStock('p1', 1);
      expect(mockDb.query).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    it('should upsert entity into database and in-memory store', async () => {
      mockDb.query.mockResolvedValueOnce({ rowCount: 1 } as any);

      const newProduct = new Product({
        id: 'new-p',
        name: 'New Product',
        description: 'New Desc',
        priceInCents: 99000,
        stock: 10,
        imageUrl: 'https://example.com/img.jpg',
      });

      await repository.save(newProduct);
      const retrieved = await repository.findById('new-p');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('new-p');
    });
  });
});
