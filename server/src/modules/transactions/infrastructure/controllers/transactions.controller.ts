import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Inject,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProcessCheckoutUseCase } from '../../application/use-cases/process-checkout.use-case';
import { GetTransactionUseCase } from '../../application/use-cases/get-transaction.use-case';
import { ProcessCheckoutDto } from '../../application/dtos/process-checkout.dto';
import {
  PAYMENT_GATEWAY_PORT,
  PaymentGatewayPort,
} from '../../../payment-gateway/application/ports/payment-gateway.port';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly processCheckoutUseCase: ProcessCheckoutUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort
  ) {}

  @Get('merchant/acceptance')
  @ApiOperation({ summary: 'Retrieve sandbox payment gateway acceptance tokens' })
  @ApiResponse({ status: 200, description: 'Acceptance tokens retrieved' })
  async getMerchantAcceptance() {
    const result = await this.paymentGateway.fetchMerchantAcceptanceTokens();
    if (result.isFail) {
      throw new BadRequestException(result.error.message);
    }
    return {
      success: true,
      data: result.value,
    };
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute checkout payment saga: reserve stock, tokenize charge, assign delivery' })
  @ApiResponse({ status: 200, description: 'Checkout completed (APPROVED, DECLINED, or ERROR)' })
  @ApiResponse({ status: 400, description: 'Invalid checkout payload or business rule violation' })
  async processCheckout(@Body() dto: ProcessCheckoutDto) {
    const result = await this.processCheckoutUseCase.execute(dto);
    if (result.isFail) {
      throw new BadRequestException(result.error.message);
    }
    return {
      success: true,
      data: result.value,
    };
  }

  @Get(':reference')
  @ApiOperation({ summary: 'Query transaction details and status by unique reference' })
  @ApiParam({ name: 'reference', description: 'Transaction reference code (e.g. TX-1710000000000-ABC)' })
  @ApiResponse({ status: 200, description: 'Transaction record found' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async getTransaction(@Param('reference') reference: string) {
    const result = await this.getTransactionUseCase.execute(reference);
    if (result.isFail) {
      throw new NotFoundException(result.error.message);
    }
    return {
      success: true,
      data: result.value.toJSON(),
    };
  }
}
