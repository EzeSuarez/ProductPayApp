import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly getProductsUseCase: GetProductsUseCase) {}

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
}
