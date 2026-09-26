import { Product } from './product.entity';
import { InsufficientStockError } from './errors/insufficient-stock.error';

describe('Product Entity', () => {
  const createProduct = (stock = 10) =>
    new Product({
      id: 'prod-123',
      name: 'Sony Headphones',
      description: 'Noise Cancelling',
      priceInCents: 15000000,
      stock,
      imageUrl: 'https://example.com/image.jpg',
    });

  it('should initialize with correct properties', () => {
    const product = createProduct(5);
    expect(product.id).toBe('prod-123');
    expect(product.name).toBe('Sony Headphones');
    expect(product.description).toBe('Noise Cancelling');
    expect(product.priceInCents).toBe(15000000);
    expect(product.stock).toBe(5);
    expect(product.imageUrl).toBe('https://example.com/image.jpg');
    expect(product.createdAt).toBeInstanceOf(Date);
    expect(product.updatedAt).toBeInstanceOf(Date);
  });

  describe('hasStockFor', () => {
    it('should return true when stock is sufficient', () => {
      const product = createProduct(5);
      expect(product.hasStockFor(3)).toBe(true);
      expect(product.hasStockFor(5)).toBe(true);
    });

    it('should return false when requested quantity exceeds stock', () => {
      const product = createProduct(2);
      expect(product.hasStockFor(3)).toBe(false);
    });

    it('should return false for non-positive quantities', () => {
      const product = createProduct(5);
      expect(product.hasStockFor(0)).toBe(false);
      expect(product.hasStockFor(-1)).toBe(false);
    });
  });

  describe('reserveStock', () => {
    it('should decrement stock and return Result.ok when sufficient stock exists', () => {
      const product = createProduct(10);
      const result = product.reserveStock(3);

      expect(result.isOk).toBe(true);
      expect(product.stock).toBe(7);
    });

    it('should return Result.fail with InsufficientStockError when stock is insufficient', () => {
      const product = createProduct(2);
      const result = product.reserveStock(5);

      expect(result.isFail).toBe(true);
      if (result.isFail) {
        expect(result.error).toBeInstanceOf(InsufficientStockError);
        expect(result.error.statusCode).toBe(409);
        expect(result.error.code).toBe('INSUFFICIENT_STOCK');
      }
      expect(product.stock).toBe(2); // unchanged
    });
  });

  describe('releaseStock', () => {
    it('should increment stock by released quantity', () => {
      const product = createProduct(5);
      product.releaseStock(3);
      expect(product.stock).toBe(8);
    });
  });

  describe('toJSON', () => {
    it('should serialize to plain JSON object with formatted strings', () => {
      const product = createProduct(4);
      const json = product.toJSON();

      expect(json.id).toBe('prod-123');
      expect(json.name).toBe('Sony Headphones');
      expect(json.priceInCents).toBe(15000000);
      expect(json.stock).toBe(4);
      expect(typeof json.createdAt).toBe('string');
      expect(typeof json.updatedAt).toBe('string');
    });
  });
});
