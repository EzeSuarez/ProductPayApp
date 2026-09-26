import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Result } from '../../../../common/domain/result';
import { DomainError, EntityNotFoundError } from '../../../../common/domain/domain-error.base';
import { InsufficientStockError } from '../../../products/domain/errors/insufficient-stock.error';
import {
  PRODUCT_REPOSITORY_PORT,
  ProductRepositoryPort,
} from '../../../products/application/ports/product.repository.port';
import {
  CUSTOMER_REPOSITORY_PORT,
  CustomerRepositoryPort,
} from '../../../customers/application/ports/customer.repository.port';
import {
  DELIVERY_REPOSITORY_PORT,
  DeliveryRepositoryPort,
} from '../../../deliveries/application/ports/delivery.repository.port';
import {
  TRANSACTION_REPOSITORY_PORT,
  TransactionRepositoryPort,
} from '../ports/transaction.repository.port';
import {
  PAYMENT_GATEWAY_PORT,
  PaymentGatewayPort,
} from '../../../payment-gateway/application/ports/payment-gateway.port';
import { Customer } from '../../../customers/domain/customer.entity';
import { Delivery } from '../../../deliveries/domain/delivery.entity';
import { Transaction } from '../../domain/transaction.entity';
import {
  ProcessCheckoutDto,
  CheckoutResultDto,
} from '../dtos/process-checkout.dto';

export class CheckoutError extends DomainError {
  readonly code = 'CHECKOUT_ERROR';
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
  }
}

@Injectable()
export class ProcessCheckoutUseCase {
  private readonly logger = new Logger(ProcessCheckoutUseCase.name);

  // Standard platform fees (in COP cents: 1 COP = 100 cents)
  public static readonly BASE_FEE_IN_CENTS = 500000; // $5,000 COP
  public static readonly DELIVERY_FEE_IN_CENTS = 1000000; // $10,000 COP

  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
    @Inject(DELIVERY_REPOSITORY_PORT)
    private readonly deliveryRepository: DeliveryRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT)
    private readonly paymentGateway: PaymentGatewayPort
  ) {}

  async execute(
    dto: ProcessCheckoutDto
  ): Promise<Result<CheckoutResultDto, DomainError>> {
    // 1. Verify product availability
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      return Result.fail(new EntityNotFoundError('Product', dto.productId));
    }

    if (product.stock <= 0) {
      return Result.fail(new InsufficientStockError(product.id, 1, 0));
    }

    // 2. Reserve stock atomically
    const stockReserved = await this.productRepository.decrementStockAtomic(
      product.id,
      1
    );
    if (!stockReserved) {
      return Result.fail(new InsufficientStockError(product.id, 1, product.stock));
    }

    let customer: Customer;
    let delivery: Delivery;
    let transaction: Transaction;

    try {
      // 3. Customer Upsert / Retrieval
      const existingCustomer = await this.customerRepository.findByEmail(
        dto.customer.email
      );
      if (existingCustomer) {
        customer = existingCustomer;
      } else {
        customer = new Customer({
          id: randomUUID(),
          fullName: dto.customer.fullName,
          email: dto.customer.email,
          phoneNumber: dto.customer.phoneNumber,
          legalId: dto.customer.legalId,
        });
        await this.customerRepository.save(customer);
      }

      // 4. Create Delivery record
      delivery = new Delivery({
        id: randomUUID(),
        customerId: customer.id,
        addressLine1: dto.delivery.addressLine1,
        addressLine2: dto.delivery.addressLine2,
        city: dto.delivery.city,
        region: dto.delivery.region,
        postalCode: dto.delivery.postalCode,
        status: 'PENDING',
      });
      await this.deliveryRepository.save(delivery);

      // 5. Calculate transaction amounts & create PENDING transaction
      const productAmount = product.priceInCents;
      const baseFee = ProcessCheckoutUseCase.BASE_FEE_IN_CENTS;
      const deliveryFee = ProcessCheckoutUseCase.DELIVERY_FEE_IN_CENTS;
      const totalAmount = productAmount + baseFee + deliveryFee;
      const reference = `TX-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

      transaction = new Transaction({
        id: randomUUID(),
        reference,
        productId: product.id,
        customerId: customer.id,
        deliveryId: delivery.id,
        productAmountInCents: productAmount,
        baseFeeInCents: baseFee,
        deliveryFeeInCents: deliveryFee,
        totalAmountInCents: totalAmount,
        currency: 'COP',
        status: 'PENDING',
        cardBrand: dto.payment.cardBrand,
        lastFour: dto.payment.lastFour,
      });

      await this.transactionRepository.save(transaction);

      // 6. Dispatch payment charge through Payment Gateway Adapter
      const chargeResult = await this.paymentGateway.processCardCharge({
        reference,
        amountInCents: totalAmount,
        currency: 'COP',
        customerEmail: customer.email,
        cardToken: dto.payment.cardToken,
        installments: dto.payment.installments ?? 1,
        acceptanceToken: dto.payment.acceptanceToken,
        acceptPersonalAuth: dto.payment.acceptPersonalAuth,
      });

      // 7. Process Gateway Response & Handle Saga Outcomes
      if (chargeResult.isFail) {
        // Gateway rejected or timed out: Rollback stock reservation
        await this.productRepository.incrementStock(product.id, 1);
        transaction.markDeclined(chargeResult.error.message);
        await this.transactionRepository.save(transaction);

        return Result.ok({
          transactionId: transaction.id,
          reference: transaction.reference,
          status: 'DECLINED',
          productId: product.id,
          totalAmountInCents: totalAmount,
          currency: 'COP',
          errorReason: chargeResult.error.message,
          customerId: customer.id,
          deliveryId: delivery.id,
        });
      }

      const payment = chargeResult.value;

      if (payment.status === 'APPROVED') {
        // Payment Succeeded: Confirm transaction and assign delivery
        transaction.markApproved(payment.externalId, customer.id, delivery.id);
        await this.transactionRepository.save(transaction);

        const trackingNumber = `TRK-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
        delivery.assignTracking(trackingNumber);
        await this.deliveryRepository.save(delivery);

        return Result.ok({
          transactionId: transaction.id,
          reference: transaction.reference,
          status: 'APPROVED',
          productId: product.id,
          totalAmountInCents: totalAmount,
          currency: 'COP',
          gatewayTransactionId: payment.externalId,
          customerId: customer.id,
          deliveryId: delivery.id,
        });
      } else if (payment.status === 'DECLINED') {
        // Gateway card declined: Rollback stock
        await this.productRepository.incrementStock(product.id, 1);
        transaction.markDeclined('Card was declined by issuing bank');
        await this.transactionRepository.save(transaction);

        return Result.ok({
          transactionId: transaction.id,
          reference: transaction.reference,
          status: 'DECLINED',
          productId: product.id,
          totalAmountInCents: totalAmount,
          currency: 'COP',
          gatewayTransactionId: payment.externalId,
          errorReason: 'Card was declined by issuing bank',
          customerId: customer.id,
          deliveryId: delivery.id,
        });
      } else {
        // Gateway error: Rollback stock
        await this.productRepository.incrementStock(product.id, 1);
        transaction.markError(`Gateway status: ${payment.status}`);
        await this.transactionRepository.save(transaction);

        return Result.ok({
          transactionId: transaction.id,
          reference: transaction.reference,
          status: payment.status,
          productId: product.id,
          totalAmountInCents: totalAmount,
          currency: 'COP',
          gatewayTransactionId: payment.externalId,
          errorReason: `Transaction ended with status: ${payment.status}`,
          customerId: customer.id,
          deliveryId: delivery.id,
        });
      }
    } catch (err: any) {
      // Saga Compensation on unhandled failure
      this.logger.error(`Critical error during checkout saga: ${err.message}`, err.stack);
      await this.productRepository.incrementStock(product.id, 1);
      return Result.fail(
        new CheckoutError(
          err.message || 'An unexpected error occurred during checkout processing.'
        )
      );
    }
  }
}
