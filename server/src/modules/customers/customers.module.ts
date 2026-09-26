import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PORT } from './application/ports/customer.repository.port';
import { PostgresCustomerRepository } from './infrastructure/adapters/postgres-customer.repository';
import { CustomersController } from './infrastructure/controllers/customers.controller';

@Module({
  controllers: [CustomersController],
  providers: [
    {
      provide: CUSTOMER_REPOSITORY_PORT,
      useClass: PostgresCustomerRepository,
    },
  ],
  exports: [CUSTOMER_REPOSITORY_PORT],
})
export class CustomersModule {}
