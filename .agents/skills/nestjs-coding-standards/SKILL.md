---
name: nestjs-coding-standards
description: >-
  TypeScript & Nest.js coding standards and best practices for the ProductPayApp
  backend API. Use when writing or reviewing any TypeScript/Nest.js code: naming,
  strict typing, Hexagonal Architecture (Ports & Adapters), Railway Oriented
  Programming (ROP) with Result<T, E>, validation pipes, dependency injection,
  PostgreSQL persistence, OWASP security, non-PII logging, and Jest unit tests (>80% coverage).
metadata:
  type: project
  stack: Nest.js / TypeScript / PostgreSQL / PostgREST
  architecture: Hexagonal (Ports & Adapters) + ROP
---

# Nest.js / TypeScript — Coding Standards

These conventions apply to every backend TypeScript file in the solution. They ensure high code clarity, robust domain isolation, adherence to Hexagonal Architecture, Railway Oriented Programming (ROP), and the strict evaluation rubrics defined in the project specification.

**If unit test coverage is under 80% or architectural rules are breached, the code is not done.**

---

## 1. Core Principles

- **Separation of Concerns (Hexagonal / Ports & Adapters)**: Controllers only handle HTTP translation. Business logic lives strictly in Domain & Application Use Cases. External services (DB, Payment Gateway, Deliveries) sit behind Port interfaces.
- **Railway Oriented Programming (ROP)**: Expected business failures are modeled explicitly as typed `Result<T, E>` values. Exceptions are reserved strictly for unrecoverable infrastructure crashes.
- **KISS & YAGNI**: Build what the 5-step checkout flow requires. Avoid speculative enterprise bloat.
- **Zero Sensitive Data Exposure**: Credit card PANs (full card numbers) and CVVs must NEVER be logged, serialized, or stored in backend persistent tables.

---

## 2. TypeScript & Nest.js Standards

### Strict Typing & Domain Primitives
- `strict: true` in `tsconfig.json`. Never use `any`. Use `unknown` with type guards if dynamic parsing is required.
- Never use the non-null assertion operator `!` to bypass compile-time checks.
- Strongly-typed identifiers: Prefer branded types or value objects (`ProductId`, `TransactionId`, `CustomerId`) over plain strings to prevent accidental parameter swapping.
- Monetary values: Represent monetary amounts in **integer cents** (e.g., `amountInCents: number`) or with a dedicated `Money` value object (`amount: number`, `currency: 'COP' | 'USD'`) to prevent floating-point rounding errors.

### Immutability & DTOs
- DTOs and Value Objects should be `Readonly<T>` or use `readonly` properties.
- Domain entities must protect their invariants: mutations occur via domain methods (e.g. `product.decrementStock(quantity)`), not arbitrary property assignments.

### Naming Conventions
- `PascalCase` for Classes, Interfaces, Enums, Types, and Decorators.
- `camelCase` for variables, properties, methods, and functions.
- `UPPER_SNAKE_CASE` for global constants and environment variable keys.
- File names: kebab-case with descriptive suffix:
  - `product.entity.ts`, `create-transaction.use-case.ts`
  - `payment-gateway.port.ts`, `wompi-payment-gateway.adapter.ts`
  - `products.controller.ts`, `product.repository.port.ts`

---

## 3. Railway Oriented Programming (ROP)

All Application Use Cases must follow Railway Oriented Programming using a typed `Result<T, E>` monad.

### Result Monad Definition
```typescript
export type Result<T, E = DomainError> = Ok<T, E> | Fail<T, E>;

export class Ok<T, E> {
  readonly isOk = true as const;
  readonly isFail = false as const;
  constructor(readonly value: T) {}
}

export class Fail<T, E> {
  readonly isOk = false as const;
  readonly isFail = true as const;
  constructor(readonly error: E) {}
}

export const Result = {
  ok: <T, E = never>(value: T): Result<T, E> => new Ok(value),
  fail: <T = never, E = DomainError>(error: E): Result<T, E> => new Fail(error),
};
```

### Composing Use Cases with ROP
Use cases chain operations along the success track. If any step fails, execution short-circuits to the failure track:

```typescript
@Injectable()
export class ProcessPaymentUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY_PORT) private readonly productRepo: ProductRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT) private readonly txRepo: TransactionRepositoryPort,
    @Inject(PAYMENT_GATEWAY_PORT) private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(command: ProcessPaymentCommand): Promise<Result<PaymentSuccessDto, DomainError>> {
    // Step 1: Validate & reserve product stock
    const product = await this.productRepo.findById(command.productId);
    if (!product) {
      return Result.fail(new EntityNotFoundError('Product', command.productId));
    }
    const reserveResult = product.reserveStock(command.quantity);
    if (reserveResult.isFail) {
      return Result.fail(reserveResult.error);
    }

    // Step 2: Create transaction in PENDING status
    const pendingTx = Transaction.createPending({
      productId: product.id,
      amountInCents: command.amountInCents,
      customerEmail: command.customerEmail,
    });
    await this.txRepo.save(pendingTx);

    // Step 3: Call Payment Gateway
    const gatewayResult = await this.paymentGateway.tokenizeAndCharge(command.paymentDetails);
    if (gatewayResult.isFail) {
      pendingTx.markFailed(gatewayResult.error.message);
      await this.txRepo.save(pendingTx);
      product.releaseStock(command.quantity);
      await this.productRepo.save(product);
      return Result.fail(gatewayResult.error);
    }

    // Step 4: Finalize on success
    pendingTx.markApproved(gatewayResult.value.externalTransactionId);
    product.commitStockDeduction(command.quantity);
    
    await this.productRepo.save(product);
    await this.txRepo.save(pendingTx);

    return Result.ok({
      transactionId: pendingTx.id,
      status: pendingTx.status,
      receiptUrl: gatewayResult.value.receiptUrl,
    });
  }
}
```

---

## 4. Hexagonal Architecture & Dependency Injection

### The Dependency Rule
- **Domain**: Pure business rules and entities. No NestJS decorators, no HTTP references, no database dependencies.
- **Application**: Use Cases / Interactors and Ports (interfaces). Depends only on Domain.
- **Infrastructure (Adapters)**:
  - **Inbound/Driving**: NestJS Controllers, CLI handlers, Webhooks.
  - **Outbound/Driven**: Repositories (PostgreSQL / PostgREST), Payment Gateway client, Mailer/Delivery adapters.

### DI Tokens
TypeScript interfaces are erased at runtime. For Port injection, use unique `Symbol` tokens:
```typescript
export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');
export const PRODUCT_REPOSITORY_PORT = Symbol('PRODUCT_REPOSITORY_PORT');
export const TRANSACTION_REPOSITORY_PORT = Symbol('TRANSACTION_REPOSITORY_PORT');
```
Wire them in NestJS Modules:
```typescript
@Module({
  controllers: [TransactionsController],
  providers: [
    ProcessPaymentUseCase,
    {
      provide: PAYMENT_GATEWAY_PORT,
      useClass: WompiPaymentGatewayAdapter,
    },
    {
      provide: TRANSACTION_REPOSITORY_PORT,
      useClass: PostgresTransactionRepositoryAdapter,
    },
  ],
})
export class TransactionsModule {}
```

---

## 5. API Design & Controllers

- **Thin Controllers**: Parse request DTOs, execute Use Case, map `Result<T, E>` to HTTP status code. No business decisions in controllers.
- **Input Validation**: Use `class-validator` with strict `ValidationPipe`:
  ```typescript
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  ```
- **Error Mapping (RFC 7807)**:
  - Convert domain errors to standard HTTP Problem Details format:
    - `EntityNotFoundError` -> `404 Not Found`
    - `InsufficientStockError` -> `409 Conflict`
    - `PaymentDeclinedError` -> `422 Unprocessable Entity`
    - `ValidationError` -> `400 Bad Request`

---

## 6. PostgreSQL & Persistence (PostgREST / pg / ORM)

- **Stock Concurrency Protection**: Prevent overselling race conditions using atomic SQL updates or row-level locking:
  ```sql
  UPDATE products
  SET stock = stock - $1
  WHERE id = $2 AND stock >= $1
  RETURNING *;
  ```
- **Idempotency**: All transaction creation and webhook calls must use unique idempotency keys or references (`reference` column with `UNIQUE` constraint).
- **Database Seeding**: The DB must include automated seeds with dummy products (description, price, stock, image URL) so the store is instantly testable.

---

## 7. Security & OWASP Alignments

- **Helmet**: Enable standard HTTP security headers:
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```
- **CORS**: Strict CORS whitelist matching the frontend client domain.
- **Rate Limiting**: Protect payment checkout endpoints with `@nestjs/throttler` to prevent carding attacks.
- **Zero Sensitive Data Ingestion**:
  - Credit card numbers, expiration dates, and CVVs must be tokenized directly via the payment gateway's tokenization service before reaching server database persistence.
  - Never log card details, authorization tokens, or customer passwords.
- **Structured Non-PII Logging**:
  - Log correlation IDs, transaction references, error codes, and HTTP statuses.
  - Mask emails (e.g. `j***@example.com`) and never print payment card numbers.

---

## 8. Unit Testing Standards (Jest — >80% Coverage)

As required by the test rubric, unit test coverage must strictly exceed **80%** across both frontend and backend.

- **AAA Pattern**: Structure every test into Arrange, Act, Assert.
- **Isolated Unit Tests**: Unit tests must never make real HTTP calls or connect to a real database. Mock all outbound Ports using test doubles.
- **Deterministic**: Tests must never rely on `Date.now()` without mocking or random unseeded values.
- **Cover Failure Tracks**: Test every ROP failure branch (insufficient stock, invalid card token, gateway timeout, rejected payment).

```typescript
describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let mockProductRepo: jest.Mocked<ProductRepositoryPort>;
  let mockTxRepo: jest.Mocked<TransactionRepositoryPort>;
  let mockGateway: jest.Mocked<PaymentGatewayPort>;

  beforeEach(() => {
    mockProductRepo = { findById: jest.fn(), save: jest.fn() } as any;
    mockTxRepo = { save: jest.fn() } as any;
    mockGateway = { tokenizeAndCharge: jest.fn() } as any;

    useCase = new ProcessPaymentUseCase(mockProductRepo, mockTxRepo, mockGateway);
  });

  it('should return Fail when product stock is insufficient', async () => {
    // Arrange
    const product = new Product({ id: 'p1', stock: 0, priceInCents: 50000 });
    mockProductRepo.findById.mockResolvedValue(product);

    // Act
    const result = await useCase.execute({
      productId: 'p1',
      quantity: 1,
      amountInCents: 50000,
      customerEmail: 'test@example.com',
      paymentDetails: {} as any,
    });

    // Assert
    expect(result.isFail).toBe(true);
    expect(result.error).toBeInstanceOf(InsufficientStockError);
    expect(mockGateway.tokenizeAndCharge).not.toHaveBeenCalled();
  });
});
```

---

## 9. Code Smells to Reject in Review

- Business logic or database calls directly in `@Controller()` methods.
- Catching exceptions without re-wrapping or logging (`catch (e) {}`).
- Bypassing ROP by throwing domain errors as HTTP exceptions from domain entities.
- Logging full card payloads or storing plain text PAN/CVV.
- Missing Jest tests or test suites failing the 80% coverage threshold.
- Hardcoded URLs or sandbox secrets in source code (always use `@nestjs/config` and `.env`).
- Missing atomic checks when updating inventory stock.
