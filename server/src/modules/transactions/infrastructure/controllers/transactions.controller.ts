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
import { ProcessCheckoutUseCase } from '../../application/use-cases/process-checkout.use-case';
import { GetTransactionUseCase } from '../../application/use-cases/get-transaction.use-case';
import { ProcessCheckoutDto } from '../../application/dtos/process-checkout.dto';
import {
  PAYMENT_GATEWAY_PORT,
  PaymentGatewayPort,
} from '../../../payment-gateway/application/ports/payment-gateway.port';

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly processCheckoutUseCase: ProcessCheckoutUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort
  ) {}

  @Get('merchant/acceptance')
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
