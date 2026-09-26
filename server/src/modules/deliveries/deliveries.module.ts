import { Module } from '@nestjs/common';
import { DELIVERY_REPOSITORY_PORT } from './application/ports/delivery.repository.port';
import { PostgresDeliveryRepository } from './infrastructure/adapters/postgres-delivery.repository';
import { DeliveriesController } from './infrastructure/controllers/deliveries.controller';

@Module({
  controllers: [DeliveriesController],
  providers: [
    {
      provide: DELIVERY_REPOSITORY_PORT,
      useClass: PostgresDeliveryRepository,
    },
  ],
  exports: [DELIVERY_REPOSITORY_PORT],
})
export class DeliveriesModule {}
