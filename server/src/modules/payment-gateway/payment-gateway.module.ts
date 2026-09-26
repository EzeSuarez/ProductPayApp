import { Module } from '@nestjs/common';
import { PAYMENT_GATEWAY_PORT } from './application/ports/payment-gateway.port';
import { SandboxPaymentGatewayAdapter } from './infrastructure/adapters/sandbox-payment-gateway.adapter';

@Module({
  providers: [
    {
      provide: PAYMENT_GATEWAY_PORT,
      useClass: SandboxPaymentGatewayAdapter,
    },
  ],
  exports: [PAYMENT_GATEWAY_PORT],
})
export class PaymentGatewayModule {}
