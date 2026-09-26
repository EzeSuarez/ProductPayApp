import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { ProcessCheckoutUseCase } from '../../application/use-cases/process-checkout.use-case';
import { GetTransactionUseCase, TransactionNotFoundError } from '../../application/use-cases/get-transaction.use-case';
import { PaymentGatewayPort } from '../../../payment-gateway/application/ports/payment-gateway.port';
import { Result } from '../../../../common/domain/result';
import { Transaction } from '../../domain/transaction.entity';
import { InsufficientStockError } from '../../../products/domain/errors/insufficient-stock.error';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let mockProcessCheckout: jest.Mocked<ProcessCheckoutUseCase>;
  let mockGetTransaction: jest.Mocked<GetTransactionUseCase>;
  let mockPaymentGateway: jest.Mocked<PaymentGatewayPort>;

  beforeEach(() => {
    mockProcessCheckout = {
      execute: jest.fn(),
    } as any;

    mockGetTransaction = {
      execute: jest.fn(),
    } as any;

    mockPaymentGateway = {
      fetchMerchantAcceptanceTokens: jest.fn(),
      processCardCharge: jest.fn(),
      getTransactionStatus: jest.fn(),
    };

    controller = new TransactionsController(
      mockProcessCheckout,
      mockGetTransaction,
      mockPaymentGateway
    );
  });

  describe('getMerchantAcceptance', () => {
    it('should return acceptance tokens when gateway succeeds', async () => {
      mockPaymentGateway.fetchMerchantAcceptanceTokens.mockResolvedValueOnce(
        Result.ok({
          acceptanceToken: 'tok_acc_123',
          acceptancePermalink: 'https://example.com/terms',
          personalAuthToken: 'tok_auth_456',
          personalAuthPermalink: 'https://example.com/privacy',
        })
      );

      const res = await controller.getMerchantAcceptance();

      expect(res.success).toBe(true);
      expect(res.data.acceptanceToken).toBe('tok_acc_123');
    });

    it('should throw BadRequestException when gateway fails', async () => {
      mockPaymentGateway.fetchMerchantAcceptanceTokens.mockResolvedValueOnce(
        Result.fail({ message: 'Gateway unreachable' } as any)
      );

      await expect(controller.getMerchantAcceptance()).rejects.toThrow(BadRequestException);
    });
  });

  describe('processCheckout', () => {
    it('should return 200 and checkout result when use case succeeds', async () => {
      mockProcessCheckout.execute.mockResolvedValueOnce(
        Result.ok({
          transactionId: 'tx-1',
          reference: 'TX-REF-001',
          status: 'APPROVED',
          productId: 'p-1',
          totalAmountInCents: 150000000,
          currency: 'COP',
        })
      );

      const res = await controller.processCheckout({} as any);

      expect(res.success).toBe(true);
      expect(res.data.status).toBe('APPROVED');
    });

    it('should throw BadRequestException when use case returns domain failure', async () => {
      mockProcessCheckout.execute.mockResolvedValueOnce(
        Result.fail(new InsufficientStockError('p-1', 1, 0))
      );

      await expect(controller.processCheckout({} as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTransaction', () => {
    it('should return serialized transaction when found', async () => {
      const tx = new Transaction({
        id: 'tx-1',
        reference: 'TX-REF-001',
        productId: 'p-1',
        productAmountInCents: 1000000,
        baseFeeInCents: 500000,
        deliveryFeeInCents: 1000000,
        totalAmountInCents: 2500000,
        status: 'APPROVED',
      });
      mockGetTransaction.execute.mockResolvedValueOnce(Result.ok(tx));

      const res = await controller.getTransaction('TX-REF-001');

      expect(res.success).toBe(true);
      expect(res.data.reference).toBe('TX-REF-001');
    });

    it('should throw NotFoundException when transaction not found', async () => {
      mockGetTransaction.execute.mockResolvedValueOnce(
        Result.fail(new TransactionNotFoundError('TX-UNKNOWN'))
      );

      await expect(controller.getTransaction('TX-UNKNOWN')).rejects.toThrow(NotFoundException);
    });
  });
});
