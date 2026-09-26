import { Result } from '../../../../common/domain/result';
import { DomainError } from '../../../../common/domain/domain-error.base';
import {
  ChargeTransactionDto,
  ChargeResultDto,
  MerchantAcceptanceDto,
} from '../dtos/charge-transaction.dto';

export class GatewayError extends DomainError {
  readonly code = 'GATEWAY_ERROR';
  readonly statusCode = 422;

  constructor(message: string) {
    super(message);
  }
}

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');

export interface PaymentGatewayPort {
  fetchMerchantAcceptanceTokens(): Promise<Result<MerchantAcceptanceDto, GatewayError>>;
  processCardCharge(dto: ChargeTransactionDto): Promise<Result<ChargeResultDto, GatewayError>>;
  getTransactionStatus(externalId: string): Promise<Result<ChargeResultDto, GatewayError>>;
}
