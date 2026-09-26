import { DomainError } from '../../../../common/domain/domain-error.base';

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly statusCode = 409;

  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product '${productId}'. Requested: ${requested}, Available: ${available}.`
    );
  }
}
