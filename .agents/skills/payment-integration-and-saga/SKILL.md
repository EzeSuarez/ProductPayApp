---
name: payment-integration-and-saga
description: >-
  Payment gateway integration and checkout saga standards for the sandbox environment.
  Covers acceptance tokens, card tokenization, SHA-256 integrity signature calculation,
  idempotent transaction lifecycle, fake card testing configurations, and strict zero-PCI compliance.
metadata:
  type: project
  stack: TypeScript / Axios / Crypto / Nest.js
  scope: Payment Gateway Adapter & Saga
---

# Payment Gateway Integration & Checkout Saga

This document specifies the exact communication protocol, cryptographic signature generation, and state transitions for payment processing in the Sandbox environment.

> [!WARNING]
> **Strict Evaluation Rule**: In accordance with candidate instructions, do **not** hardcode brand names (such as the provider's company name) in repository names or public class identifiers. Use domain-centric terminology (`PaymentGatewayPort`, `SandboxPaymentAdapter`, `CheckoutService`).

---

## 1. Sandbox Environment & API Credentials

All sandbox integration calls must use environment variables loaded through `@nestjs/config`.

```env
# Payment Gateway Configuration
PAYMENT_GATEWAY_API_URL=https://api-sandbox.co.uat.wompi.dev/v1
PAYMENT_GATEWAY_PUBLIC_KEY=pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mOt7
PAYMENT_GATEWAY_PRIVATE_KEY=prv_stagtest_5i0ZGIGiFcDQifYsXxvsny7Y37tKqFWg
PAYMENT_GATEWAY_EVENTS_SECRET=stagtest_events_2PDUmhMywUkvb1LvxYnayFbmofT7w39N
PAYMENT_GATEWAY_INTEGRITY_SECRET=stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp
```

---

## 2. Cryptographic Integrity Signature (SHA-256)

To prevent client-side payment amount tampering, every transaction must carry a server-generated SHA-256 integrity signature.

### Signature Concatenation Rule
The string to hash is composed of:
`{reference}{amount_in_cents}{currency}{integrity_secret}`

```typescript
import { createHash } from 'crypto';

export class PaymentIntegritySigner {
  static generateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
    integritySecret: string,
  ): string {
    const rawString = `${reference}${amountInCents}${currency}${integritySecret}`;
    return createHash('sha256').update(rawString, 'utf8').digest('hex');
  }
}
```

---

## 3. The Payment Flow Step-by-Step

```
[Customer Frontend]             [Backend API]             [Gateway Sandbox API]
        │                             │                             │
        │ 1. Get Acceptance Token     │                             │
        ├─────────────────────────────┼────────────────────────────►│ GET /merchants/{pub_key}
        │◄────────────────────────────┼─────────────────────────────┤ (acceptance_token)
        │                             │                             │
        │ 2. Tokenize Card Directly   │                             │
        ├─────────────────────────────┼────────────────────────────►│ POST /tokens/cards
        │◄────────────────────────────┼─────────────────────────────┤ (tok_test_xxxx)
        │                             │                             │
        │ 3. Submit Checkout          │                             │
        │    (tok_test_xxxx + Deliv)  │                             │
        ├────────────────────────────►│                             │
        │                             │ 4. Reserve Stock            │
        │                             │ 5. Save Tx (PENDING)        │
        │                             │ 6. Generate SHA-256 Sig     │
        │                             │                             │
        │                             │ 7. Dispatch Transaction     │
        │                             ├────────────────────────────►│ POST /transactions
        │                             │◄────────────────────────────┤ Status: PENDING / APPROVED
        │                             │                             │
        │                             │ 8. Update DB (APPROVED)     │
        │                             │ 9. Assign Delivery          │
        │                             │ 10. Commit Stock Deduction  │
        │◄────────────────────────────┤                             │
        │ 11. Final Status Screen     │                             │
```

---

## 4. Payment Gateway Adapter Implementation

```typescript
@Injectable()
export class SandboxPaymentGatewayAdapter implements PaymentGatewayPort {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integritySecret: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_API_URL');
    this.publicKey = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_PUBLIC_KEY');
    this.privateKey = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_PRIVATE_KEY');
    this.integritySecret = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_INTEGRITY_SECRET');
  }

  async fetchMerchantAcceptanceToken(): Promise<Result<string, GatewayError>> {
    try {
      const response = await axios.get(`${this.baseUrl}/merchants/${this.publicKey}`);
      const acceptanceToken = response.data?.data?.presigned_acceptance?.acceptance_token;
      return Result.ok(acceptanceToken);
    } catch (error) {
      return Result.fail(new GatewayError('Failed to fetch merchant acceptance token'));
    }
  }

  async processCardCharge(dto: ChargeTransactionDto): Promise<Result<ChargeResultDto, GatewayError>> {
    try {
      const signature = PaymentIntegritySigner.generateSignature(
        dto.reference,
        dto.amountInCents,
        dto.currency,
        this.integritySecret,
      );

      const payload = {
        acceptance_token: dto.acceptanceToken,
        accept_personal_auth: dto.acceptPersonalAuth,
        amount_in_cents: dto.amountInCents,
        currency: dto.currency,
        customer_email: dto.customerEmail,
        payment_method: {
          type: 'CARD',
          token: dto.cardToken,
          installments: dto.installments ?? 1,
        },
        reference: dto.reference,
        signature,
      };

      const response = await axios.post(`${this.baseUrl}/transactions`, payload, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
          'Content-Type': 'application/json',
        },
      });

      const txData = response.data.data;
      return Result.ok({
        externalId: txData.id,
        status: txData.status, // 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR'
        reference: txData.reference,
      });
    } catch (error: any) {
      return Result.fail(new GatewayError(error.response?.data?.error?.reason || 'Gateway request failed'));
    }
  }
}
```

---

## 5. Sandbox Test Cards & Verification Scenarios

| Test Card Number | Expiration | CVC | Expected Result | Testing Scenario |
|---|:---:|:---:|:---:|---|
| `4242 4242 4242 4242` | Future date | Any 3 digits | `APPROVED` | Successful onboarding checkout flow |
| `4111 1111 1111 1111` | Future date | Any 3 digits | `DECLINED` | Rejected card, stock release verification |
| Any other card number | Future date | Any 3 digits | `ERROR` | Malformed/Error gateway handling |

---

## 6. Transaction State Machine & Invariants

```
               ┌─────────────┐
               │   PENDING   │ (Created in DB before external call)
               └──────┬──────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
   ┌───────────┐┌───────────┐┌───────────┐
   │ APPROVED  ││ DECLINED  ││   ERROR   │
   └─────┬─────┘└─────┬─────┘└─────┬─────┘
         │            │            │
   [Stock Deducted] [Stock Rolled] [Stock Rolled]
   [Delivery Set]   [Back to Cart] [Back to Cart]
```

### Invariants:
1. **Never deduct stock prior to payment approval confirmation**.
2. **If payment declines or times out**, automatically release the temporary stock reservation.
3. **Idempotency**: Use a deterministic `reference` (e.g. `TX-${Date.now()}-${uuid.slice(0, 8)}`) to prevent duplicate transactions if the client retries.

---

## 7. Zero-PCI Compliance & Security

- **Never pass full raw credit card numbers or CVVs to the server**:
  - The client UI captures card details and calls the tokenization endpoint directly.
  - The server only ever receives `card_token` (`tok_test_xxxx`).
- **Structured Sanitized Logging**:
  - In interceptors and loggers, exclude any payload fields matching `card_number`, `cvv`, `cvc`, `token`.
  - Log only `transaction_id`, `reference`, `amount_in_cents`, `status`.
