import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PORT } from './application/ports/customer.repository.port';
import { PostgresCustomerRepository } from './infrastructure/adapters/postgres-customer.repository';

@Module({
  providers: [
    {
      provide: CUSTOMER_REPOSITORY_PORT,
      useClass: PostgresCustomerRepository,
    },
  ],
  exports: [CUSTOMER_REPOSITORY_PORT],
})
export class CustomersModule {}
