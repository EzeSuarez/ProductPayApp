import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DeliveriesModule } from './modules/deliveries/deliveries.module';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    ProductsModule,
    CustomersModule,
    DeliveriesModule,
    PaymentGatewayModule,
    TransactionsModule,
  ],
})
export class AppModule {}
