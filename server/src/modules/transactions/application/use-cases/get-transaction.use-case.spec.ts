import { GetTransactionUseCase, TransactionNotFoundError } from './get-transaction.use-case';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { Transaction } from '../../domain/transaction.entity';

describe('GetTransactionUseCase', () => {
  let useCase: GetTransactionUseCase;
  let mockTransactionRepo: jest.Mocked<TransactionRepositoryPort>;

  const mockTx = new Transaction({
    id: 'tx-1',
    reference: 'TX-REF-001',
    productId: 'prod-1',
    productAmountInCents: 1000000,
    baseFeeInCents: 500000,
    deliveryFeeInCents: 1000000,
    totalAmountInCents: 2500000,
    status: 'APPROVED',
  });

  beforeEach(() => {
    mockTransactionRepo = {
      findByReference: jest.fn().mockResolvedValue(mockTx),
      findById: jest.fn(),
      save: jest.fn(),
    };
    useCase = new GetTransactionUseCase(mockTransactionRepo);
  });

  it('should return transaction when found by reference', async () => {
    const result = await useCase.execute('TX-REF-001');

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.reference).toBe('TX-REF-001');
      expect(result.value.status).toBe('APPROVED');
    }
    expect(mockTransactionRepo.findByReference).toHaveBeenCalledWith('TX-REF-001');
  });

  it('should return TransactionNotFoundError when transaction does not exist', async () => {
    mockTransactionRepo.findByReference.mockResolvedValueOnce(null);

    const result = await useCase.execute('TX-NON-EXISTENT');

    expect(result.isFail).toBe(true);
    if (result.isFail) {
      expect(result.error).toBeInstanceOf(TransactionNotFoundError);
    }
  });
});
