import { ProductsController } from './products.controller';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { Result } from '../../../../common/domain/result';
import { Response } from 'express';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockUseCase: jest.Mocked<GetProductsUseCase>;
  let mockRepository: any;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
      invalidateCache: jest.fn(),
    } as any;

    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      decrementStockAtomic: jest.fn(),
      incrementStock: jest.fn(),
      save: jest.fn(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    controller = new ProductsController(mockUseCase, mockRepository);
  });

  it('should return 200 with product list when use case succeeds', async () => {
    const products = [
      {
        id: 'p1',
        name: 'Headphones',
        description: 'Noise Cancelling',
        priceInCents: 15000000,
        stock: 5,
        imageUrl: 'https://example.com/p1.jpg',
      },
    ];
    mockUseCase.execute.mockResolvedValueOnce(Result.ok(products));

    await controller.getProducts(mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: products,
      count: 1,
    });
  });

  it('should return 500 when use case fails', async () => {
    mockUseCase.execute.mockResolvedValueOnce(
      Result.fail({ message: 'Internal error' } as any)
    );

    await controller.getProducts(mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal error',
    });
  });

  it('should return 200 and product when getProductById finds product', async () => {
    const mockProduct = {
      toJSON: () => ({ id: 'p1', name: 'Headphones', stock: 5 }),
    };
    mockRepository.findById.mockResolvedValueOnce(mockProduct);

    const res = await controller.getProductById('p1');
    expect(res.statusCode).toBe(200);
    expect(res.data.id).toBe('p1');
  });

  it('should throw NotFoundException when product is not found', async () => {
    mockRepository.findById.mockResolvedValueOnce(null);

    await expect(controller.getProductById('p999')).rejects.toThrow();
  });
});
