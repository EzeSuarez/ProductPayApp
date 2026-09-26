import { Transaction } from './transaction.entity';

describe('Transaction Entity', () => {
  it('should initialize correctly with default values', () => {
    const tx = new Transaction({
      id: 'tx-1',
      reference: 'TX-REF-001',
      productId: 'prod-1',
      productAmountInCents: 1000000,
      baseFeeInCents: 500000,
      deliveryFeeInCents: 1000000,
      totalAmountInCents: 2500000,
    });

    expect(tx.id).toBe('tx-1');
    expect(tx.reference).toBe('TX-REF-001');
    expect(tx.productId).toBe('prod-1');
    expect(tx.currency).toBe('COP');
    expect(tx.status).toBe('PENDING');
    expect(tx.productAmountInCents).toBe(1000000);
    expect(tx.baseFeeInCents).toBe(500000);
    expect(tx.deliveryFeeInCents).toBe(1000000);
    expect(tx.totalAmountInCents).toBe(2500000);
    expect(tx.gatewayTransactionId).toBeUndefined();
    expect(tx.errorReason).toBeUndefined();
  });

  it('should transition to APPROVED status when markApproved is called', () => {
    const tx = new Transaction({
      id: 'tx-1',
      reference: 'TX-REF-001',
      productId: 'prod-1',
      productAmountInCents: 1000000,
      baseFeeInCents: 500000,
      deliveryFeeInCents: 1000000,
      totalAmountInCents: 2500000,
    });

    tx.markApproved('gw-tx-999', 'cust-1', 'deliv-1');

    expect(tx.status).toBe('APPROVED');
    expect(tx.gatewayTransactionId).toBe('gw-tx-999');
    expect(tx.customerId).toBe('cust-1');
    expect(tx.deliveryId).toBe('deliv-1');
  });

  it('should transition to DECLINED status when markDeclined is called', () => {
    const tx = new Transaction({
      id: 'tx-1',
      reference: 'TX-REF-001',
      productId: 'prod-1',
      productAmountInCents: 1000000,
      baseFeeInCents: 500000,
      deliveryFeeInCents: 1000000,
      totalAmountInCents: 2500000,
    });

    tx.markDeclined('Insufficient funds');

    expect(tx.status).toBe('DECLINED');
    expect(tx.errorReason).toBe('Insufficient funds');
  });

  it('should transition to ERROR status when markError is called', () => {
    const tx = new Transaction({
      id: 'tx-1',
      reference: 'TX-REF-001',
      productId: 'prod-1',
      productAmountInCents: 1000000,
      baseFeeInCents: 500000,
      deliveryFeeInCents: 1000000,
      totalAmountInCents: 2500000,
    });

    tx.markError('Gateway timeout');

    expect(tx.status).toBe('ERROR');
    expect(tx.errorReason).toBe('Gateway timeout');
  });

  it('should serialize correctly to JSON', () => {
    const tx = new Transaction({
      id: 'tx-1',
      reference: 'TX-REF-001',
      productId: 'prod-1',
      productAmountInCents: 1000000,
      baseFeeInCents: 500000,
      deliveryFeeInCents: 1000000,
      totalAmountInCents: 2500000,
      cardBrand: 'VISA',
      lastFour: '4242',
    });

    const json = tx.toJSON();

    expect(json.id).toBe('tx-1');
    expect(json.reference).toBe('TX-REF-001');
    expect(json.cardBrand).toBe('VISA');
    expect(json.lastFour).toBe('4242');
    expect(json.status).toBe('PENDING');
  });
});
