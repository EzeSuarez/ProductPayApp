import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../../../common/domain/result';
import { DomainError } from '../../../../common/domain/domain-error.base';
import {
  TRANSACTION_REPOSITORY_PORT,
  TransactionRepositoryPort,
} from '../ports/transaction.repository.port';
import { Transaction } from '../../domain/transaction.entity';

export class TransactionNotFoundError extends DomainError {
  readonly code = 'TRANSACTION_NOT_FOUND';
  readonly statusCode = 404;

  constructor(reference: string) {
    super(`Transaction with reference '${reference}' was not found.`);
  }
}

@Injectable()
export class GetTransactionUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort
  ) {}

  async execute(reference: string): Promise<Result<Transaction, DomainError>> {
    const tx = await this.transactionRepository.findByReference(reference);
    if (!tx) {
      return Result.fail(new TransactionNotFoundError(reference));
    }
    return Result.ok(tx);
  }
}
