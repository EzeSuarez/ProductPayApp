import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProductsModule } from '../products/products.module';
import { CustomersModule } from '../customers/customers.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { PaymentGatewayModule } from '../payment-gateway/payment-gateway.module';
import { TRANSACTION_REPOSITORY_PORT } from './application/ports/transaction.repository.port';
import { PostgresTransactionRepository } from './infrastructure/adapters/postgres-transaction.repository';
import { ProcessCheckoutUseCase } from './application/use-cases/process-checkout.use-case';
import { GetTransactionUseCase } from './application/use-cases/get-transaction.use-case';
import { TransactionsController } from './infrastructure/controllers/transactions.controller';

@Module({
  imports: [
    DatabaseModule,
    ProductsModule,
    CustomersModule,
    DeliveriesModule,
    PaymentGatewayModule,
  ],
  controllers: [TransactionsController],
  providers: [
    {
      provide: TRANSACTION_REPOSITORY_PORT,
      useClass: PostgresTransactionRepository,
    },
    ProcessCheckoutUseCase,
    GetTransactionUseCase,
  ],
  exports: [TRANSACTION_REPOSITORY_PORT, ProcessCheckoutUseCase, GetTransactionUseCase],
})
export class TransactionsModule {}
