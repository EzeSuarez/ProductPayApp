import { ProcessCheckoutUseCase } from './process-checkout.use-case';
import { EntityNotFoundError } from '../../../../common/domain/domain-error.base';
import { InsufficientStockError } from '../../../products/domain/errors/insufficient-stock.error';
import { ProductRepositoryPort } from '../../../products/application/ports/product.repository.port';
import { CustomerRepositoryPort } from '../../../customers/application/ports/customer.repository.port';
import { DeliveryRepositoryPort } from '../../../deliveries/application/ports/delivery.repository.port';
import { TransactionRepositoryPort } from '../ports/transaction.repository.port';
import { PaymentGatewayPort } from '../../../payment-gateway/application/ports/payment-gateway.port';
import { Product } from '../../../products/domain/product.entity';
import { Customer } from '../../../customers/domain/customer.entity';
import { Result } from '../../../../common/domain/result';
import { ProcessCheckoutDto } from '../dtos/process-checkout.dto';

describe('ProcessCheckoutUseCase', () => {
  let useCase: ProcessCheckoutUseCase;
  let mockProductRepo: jest.Mocked<ProductRepositoryPort>;
  let mockCustomerRepo: jest.Mocked<CustomerRepositoryPort>;
  let mockDeliveryRepo: jest.Mocked<DeliveryRepositoryPort>;
  let mockTransactionRepo: jest.Mocked<TransactionRepositoryPort>;
  let mockPaymentGateway: jest.Mocked<PaymentGatewayPort>;

  const sampleProduct = new Product({
    id: 'prod-123',
    name: 'Wireless Headphones',
    description: 'High fidelity audio',
    priceInCents: 145000000,
    stock: 5,
    imageUrl: 'https://example.com/headphones.jpg',
  });

  const validCheckoutDto: ProcessCheckoutDto = {
    productId: 'prod-123',
    customer: {
      fullName: 'Carlos Rodriguez',
      email: 'carlos@example.com',
      phoneNumber: '+573001234567',
      legalId: '1098765432',
    },
    delivery: {
      addressLine1: 'Calle 100 # 15-20',
      addressLine2: 'Apto 402',
      city: 'Bogota',
      region: 'Cundinamarca',
      postalCode: '110111',
    },
    payment: {
      cardToken: 'tok_test_4242_approved',
      installments: 1,
      acceptanceToken: 'acc_token_123',
      acceptPersonalAuth: 'auth_token_456',
      cardBrand: 'VISA',
      lastFour: '4242',
    },
  };

  beforeEach(() => {
    mockProductRepo = {
      findById: jest.fn().mockResolvedValue(sampleProduct),
      decrementStockAtomic: jest.fn().mockResolvedValue(true),
      incrementStock: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn(),
      save: jest.fn(),
    };

    mockCustomerRepo = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockDeliveryRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
    };

    mockTransactionRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByReference: jest.fn(),
    };

    mockPaymentGateway = {
      processCardCharge: jest.fn().mockResolvedValue(
        Result.ok({
          externalId: 'gw-tx-999',
          status: 'APPROVED',
          reference: 'TX-REF-1',
        })
      ),
      fetchMerchantAcceptanceTokens: jest.fn(),
      getTransactionStatus: jest.fn(),
    };

    useCase = new ProcessCheckoutUseCase(
      mockProductRepo,
      mockCustomerRepo,
      mockDeliveryRepo,
      mockTransactionRepo,
      mockPaymentGateway
    );
  });

  it('should return EntityNotFoundError if product does not exist', async () => {
    mockProductRepo.findById.mockResolvedValueOnce(null);

    const result = await useCase.execute(validCheckoutDto);

    expect(result.isFail).toBe(true);
    if (result.isFail) {
      expect(result.error).toBeInstanceOf(EntityNotFoundError);
    }
    expect(mockProductRepo.decrementStockAtomic).not.toHaveBeenCalled();
  });

  it('should return InsufficientStockError if product stock is 0', async () => {
    const zeroStockProduct = new Product({
      id: 'prod-0',
      name: 'Sold Out Item',
      description: 'Sold out item description',
      priceInCents: 5000000,
      stock: 0,
      imageUrl: 'https://example.com/soldout.jpg',
    });
    mockProductRepo.findById.mockResolvedValueOnce(zeroStockProduct);

    const result = await useCase.execute(validCheckoutDto);

    expect(result.isFail).toBe(true);
    if (result.isFail) {
      expect(result.error).toBeInstanceOf(InsufficientStockError);
    }
    expect(mockProductRepo.decrementStockAtomic).not.toHaveBeenCalled();
  });

  it('should return InsufficientStockError if atomic decrement fails', async () => {
    mockProductRepo.decrementStockAtomic.mockResolvedValueOnce(false);

    const result = await useCase.execute(validCheckoutDto);

    expect(result.isFail).toBe(true);
    if (result.isFail) {
      expect(result.error).toBeInstanceOf(InsufficientStockError);
    }
  });

  it('should process successful checkout when gateway approves transaction', async () => {
    const result = await useCase.execute(validCheckoutDto);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.status).toBe('APPROVED');
      expect(result.value.gatewayTransactionId).toBe('gw-tx-999');
      expect(result.value.totalAmountInCents).toBe(
        145000000 + 500000 + 1000000 // Product + Base Fee + Delivery Fee
      );
    }

    expect(mockProductRepo.decrementStockAtomic).toHaveBeenCalledTimes(1);
    expect(mockCustomerRepo.save).toHaveBeenCalledTimes(1);
    expect(mockDeliveryRepo.save).toHaveBeenCalledTimes(2); // Initial save + Tracking assigned save
    expect(mockTransactionRepo.save).toHaveBeenCalledTimes(2); // Initial pending save + Approved save
    expect(mockProductRepo.incrementStock).not.toHaveBeenCalled();
  });

  it('should reuse existing customer if email matches', async () => {
    const existing = new Customer({
      id: 'cust-existing-1',
      fullName: 'Carlos R.',
      email: 'carlos@example.com',
      phoneNumber: '+573001234567',
    });
    mockCustomerRepo.findByEmail.mockResolvedValueOnce(existing);

    const result = await useCase.execute(validCheckoutDto);

    expect(result.isOk).toBe(true);
    expect(mockCustomerRepo.save).not.toHaveBeenCalled();
  });

  it('should compensate stock and record decline if gateway returns DECLINED status', async () => {
    mockPaymentGateway.processCardCharge.mockResolvedValueOnce(
      Result.ok({
        externalId: 'gw-tx-declined',
        status: 'DECLINED',
        reference: 'TX-REF-DEC',
      })
    );

    const result = await useCase.execute(validCheckoutDto);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.status).toBe('DECLINED');
      expect(result.value.errorReason).toBe('Card was declined by issuing bank');
    }

    // Stock must have been compensated
    expect(mockProductRepo.incrementStock).toHaveBeenCalledWith('prod-123', 1);
  });

  it('should compensate stock and record decline if gateway returns failure result', async () => {
    mockPaymentGateway.processCardCharge.mockResolvedValueOnce(
      Result.fail({ message: 'Invalid card CVV' } as any)
    );

    const result = await useCase.execute(validCheckoutDto);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value.status).toBe('DECLINED');
      expect(result.value.errorReason).toBe('Invalid card CVV');
    }

    expect(mockProductRepo.incrementStock).toHaveBeenCalledWith('prod-123', 1);
  });

  it('should catch unexpected error during saga and roll back stock', async () => {
    mockCustomerRepo.findByEmail.mockRejectedValueOnce(new Error('DB Connection Timeout'));

    const result = await useCase.execute(validCheckoutDto);

    expect(result.isFail).toBe(true);
    expect(mockProductRepo.incrementStock).toHaveBeenCalledWith('prod-123', 1);
  });
});
