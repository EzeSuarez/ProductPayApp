import { PostgresTransactionRepository } from './postgres-transaction.repository';
import { DatabaseService } from '../../../../database/database.service';
import { Transaction } from '../../domain/transaction.entity';

describe('PostgresTransactionRepository', () => {
  let repository: PostgresTransactionRepository;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    } as any;
    repository = new PostgresTransactionRepository(mockDb);
  });

  it('should save and find transaction by id and reference from DB', async () => {
    const tx = new Transaction({
      id: 'tx-100',
      reference: 'TX-REF-100',
      productId: 'prod-1',
      productAmountInCents: 1000000,
      baseFeeInCents: 500000,
      deliveryFeeInCents: 1000000,
      totalAmountInCents: 2500000,
      status: 'APPROVED',
    });

    mockDb.query.mockResolvedValueOnce({ rowCount: 1 } as any);
    await repository.save(tx);

    const mockRow = {
      id: 'tx-100',
      reference: 'TX-REF-100',
      product_id: 'prod-1',
      customer_id: null,
      delivery_id: null,
      product_amount_in_cents: '1000000',
      base_fee_in_cents: '500000',
      delivery_fee_in_cents: '1000000',
      total_amount_in_cents: '2500000',
      currency: 'COP',
      status: 'APPROVED',
      gateway_transaction_id: null,
      card_brand: null,
      last_four: null,
      error_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockDb.query.mockResolvedValueOnce({ rows: [mockRow] } as any);
    const foundById = await repository.findById('tx-100');
    expect(foundById).not.toBeNull();
    expect(foundById?.reference).toBe('TX-REF-100');

    mockDb.query.mockResolvedValueOnce({ rows: [mockRow] } as any);
    const foundByRef = await repository.findByReference('TX-REF-100');
    expect(foundByRef).not.toBeNull();
    expect(foundByRef?.id).toBe('tx-100');
  });

  it('should fallback to in-memory store when DB throws', async () => {
    const tx = new Transaction({
      id: 'tx-mem',
      reference: 'TX-REF-MEM',
      productId: 'prod-1',
      productAmountInCents: 1000000,
      baseFeeInCents: 500000,
      deliveryFeeInCents: 1000000,
      totalAmountInCents: 2500000,
      status: 'PENDING',
    });

    mockDb.query.mockRejectedValueOnce(new Error('DB offline'));
    await repository.save(tx);

    mockDb.query.mockRejectedValueOnce(new Error('DB offline'));
    const found = await repository.findById('tx-mem');
    expect(found).not.toBeNull();
    expect(found?.reference).toBe('TX-REF-MEM');

    mockDb.query.mockRejectedValueOnce(new Error('DB offline'));
    const foundByRef = await repository.findByReference('TX-REF-MEM');
    expect(foundByRef).not.toBeNull();
    expect(foundByRef?.id).toBe('tx-mem');
  });
});
