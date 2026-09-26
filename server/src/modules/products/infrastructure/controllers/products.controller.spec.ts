import { ProductsController } from './products.controller';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import { Result } from '../../../../common/domain/result';
import { Response } from 'express';

describe('ProductsController', () => {
  let controller: ProductsController;
  let mockUseCase: jest.Mocked<GetProductsUseCase>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockUseCase = {
      execute: jest.fn(),
      invalidateCache: jest.fn(),
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    controller = new ProductsController(mockUseCase);
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
});
