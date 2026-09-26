import {
  Controller,
  Get,
  HttpStatus,
  Res,
  Param,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';
import {
  PRODUCT_REPOSITORY_PORT,
  ProductRepositoryPort,
} from '../../application/ports/product.repository.port';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly getProductsUseCase: GetProductsUseCase,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get list of available products with live stock units' })
  @ApiResponse({
    status: 200,
    description: 'List of products retrieved successfully',
  })
  async getProducts(@Res() res: Response) {
    const result = await this.getProductsUseCase.execute();
    if (result.isFail) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: result.error.message,
      });
    }

    return res.status(HttpStatus.OK).json({
      data: result.value,
      count: result.value.length,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single product details with live stock availability' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async getProductById(@Param('id') id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return {
      statusCode: HttpStatus.OK,
      data: product.toJSON(),
    };
  }
}

