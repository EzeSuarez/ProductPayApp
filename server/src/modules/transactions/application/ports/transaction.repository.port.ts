import { Transaction } from '../../domain/transaction.entity';

export const TRANSACTION_REPOSITORY_PORT = Symbol('TRANSACTION_REPOSITORY_PORT');

export interface TransactionRepositoryPort {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByReference(reference: string): Promise<Transaction | null>;
}
