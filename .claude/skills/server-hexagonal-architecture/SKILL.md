---
name: server-hexagonal-architecture
description: >-
  Hexagonal Architecture (Ports & Adapters) design guide for the Nest.js backend server.
  Use when organizing folders, defining domain models, implementing inbound/outbound ports,
  orchestrating Use Cases with Railway Oriented Programming (ROP), or wiring adapters
  (PostgreSQL/PostgREST repositories, Wompi payment gateway, delivery service).
metadata:
  type: project
  stack: Nest.js / TypeScript / PostgreSQL / PostgREST
  pattern: Hexagonal (Ports & Adapters)
---

# Server Hexagonal Architecture (Ports & Adapters)

This architecture isolates business domain logic from external technical frameworks, protocols, and I/O channels. Controllers and database drivers adapt to the core application; the core application never depends on them.

---

## 1. Architectural Layers & Dependency Rule

```
                      ┌──────────────────────────────────────────────┐
                      │              Driving Adapters                │
                      │  NestJS REST Controllers / Swagger / Filters  │
                      └──────────────────────┬───────────────────────┘
                                             │ calls
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │             Application Layer                │
                      │   Use Cases (ROP) · Inbound Command DTOs     │
                      └──────┬────────────────────────────────┬──────┘
                             │ uses                           │ defines
                             ▼                                ▼
              ┌─────────────────────────────┐  ┌─────────────────────────────┐
              │        Domain Layer         │  │       Secondary Ports       │
              │ Entities · Value Objects    │  │ ProductRepositoryPort       │
              │ Domain Events · Rules       │  │ TransactionRepositoryPort   │
              │ Result<T, E> & DomainErrors │  │ PaymentGatewayPort          │
              │ Pure TS — zero dependencies │  │ DeliveryRepositoryPort      │
              └─────────────────────────────┘  └──────────────┬──────────────┘
                                                              ▲
                                                              │ implements
                                       ┌──────────────────────┴──────┐
                                       │       Driven Adapters       │
                                       │ PostgreSQL / PostgREST      │
                                       │ Payment Gateway (Wompi UAT) │
                                       │ Delivery Assignment Service │
                                       └─────────────────────────────┘
```

### Inviolable Rules
1. **Domain Layer**: Must have zero external dependencies (no `@nestjs/*`, no `typeorm`, no database clients). Contains pure TypeScript classes, business invariants, and domain errors.
2. **Ports**: Application interfaces defining contracts for external capabilities (outbound: DB, Payment Gateway, SMS/Email) or inbound use cases.
3. **Adapters**: Concrete implementations of Ports. Changing the database (e.g. from PostgREST to direct PG Pool) or changing the payment provider only modifies an adapter without touching a single line of domain or use case logic.

---

## 2. Directory Layout & Module Structure

The backend organizes code into Bounded Contexts under `src/modules/`:

```
src/
├── common/                              # Shared Kernel across modules
│   ├── domain/
│   │   ├── result.ts                    # Result<T, E> monad for ROP
│   │   ├── domain-error.base.ts         # Base domain error class
│   │   └── entity.base.ts               # Base entity with ID & timestamps
│   ├── infrastructure/
│   │   ├── filters/problem-details.ts   # RFC 7807 global exception filter
│   │   └── interceptors/logger.ts       # OWASP-safe structured logger
├── modules/
│   ├── products/                        # Catalog & Stock Management
│   │   ├── domain/
│   │   │   ├── product.entity.ts
│   │   │   └── errors/insufficient-stock.error.ts
│   │   ├── application/
│   │   │   ├── ports/product.repository.port.ts
│   │   │   └── use-cases/get-products.use-case.ts
│   │   ├── infrastructure/
│   │   │   ├── adapters/postgres-product.repository.ts
│   │   │   └── controllers/products.controller.ts
│   │   └── products.module.ts
│   │
│   ├── customers/                       # Customer Onboarding
│   │   ├── domain/
│   │   │   └── customer.entity.ts
│   │   ├── application/
│   │   │   └── ports/customer.repository.port.ts
│   │   ├── infrastructure/
│   │   │   ├── adapters/postgres-customer.repository.ts
│   │   │   └── controllers/customers.controller.ts
│   │   └── customers.module.ts
│   │
│   ├── deliveries/                      # Shipping & Delivery Info
│   │   ├── domain/
│   │   │   └── delivery.entity.ts
│   │   ├── application/
│   │   │   └── ports/delivery.repository.port.ts
│   │   ├── infrastructure/
│   │   │   └── adapters/postgres-delivery.repository.ts
│   │   └── deliveries.module.ts
│   │
│   ├── payment-gateway/                 # Payment Provider Port & Adapter
│   │   ├── application/
│   │   │   ├── ports/payment-gateway.port.ts
│   │   │   └── dtos/
│   │   │       ├── tokenize-card.dto.ts
│   │   │       └── charge-transaction.dto.ts
│   │   ├── infrastructure/
│   │   │   ├── adapters/wompi-gateway.adapter.ts
│   │   │   └── config/wompi-gateway.config.ts
│   │   └── payment-gateway.module.ts
│   │
│   └── transactions/                    # Checkout & Transaction Lifecycle
│       ├── domain/
│       │   ├── transaction.entity.ts
│       │   └── transaction-status.enum.ts   # PENDING, APPROVED, DECLINED, ERROR
│       ├── application/
│       │   ├── ports/transaction.repository.port.ts
│       │   └── use-cases/
│       │       ├── process-checkout.use-case.ts
│       │       └── get-transaction-status.use-case.ts
│       ├── infrastructure/
│       │   ├── adapters/postgres-transaction.repository.ts
│       │   └── controllers/transactions.controller.ts
│       └── transactions.module.ts
│
├── database/
│   ├── migrations/                      # PostgreSQL DDL migrations
│   └── seeds/product.seed.ts            # Mandatory dummy product seeder
├── app.module.ts
└── main.ts
```

---

## 3. Core Bounded Contexts & Port Contracts

### 3.1 Product Port (`product.repository.port.ts`)
```typescript
export interface ProductRepositoryPort {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  decrementStockAtomic(productId: string, quantity: number): Promise<boolean>;
  incrementStock(productId: string, quantity: number): Promise<void>;
  save(product: Product): Promise<void>;
}
```

### 3.2 Payment Gateway Port (`payment-gateway.port.ts`)
```typescript
export interface PaymentGatewayPort {
  tokenizeCard(card: CardTokenRequestDto): Promise<Result<CardTokenResponseDto, GatewayError>>;
  createTransaction(charge: ChargeRequestDto): Promise<Result<GatewayTransactionResultDto, GatewayError>>;
  getTransactionStatus(externalId: string): Promise<Result<GatewayTransactionStatusDto, GatewayError>>;
}
```

### 3.3 Transaction Repository Port (`transaction.repository.port.ts`)
```typescript
export interface TransactionRepositoryPort {
  save(transaction: Transaction): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByReference(reference: string): Promise<Transaction | null>;
}
```

---

## 4. The 5-Step Checkout Saga (ROP Pipeline)

The central business flow described in the challenge rubric coordinates the Bounded Contexts cleanly using ROP:

```
[Client Request: Checkout]
           │
           ▼
[1. Validate Request & Customer Data] ──(Fail)──► Return 400 Bad Request
           │ (Ok)
           ▼
[2. Atomic Stock Reservation] ─────────(Fail)──► Return 409 Stock Insufficient
           │ (Ok)
           ▼
[3. Persist Transaction in PENDING] ───(Fail)──► Revert Stock & Return 500
           │ (Ok)
           ▼
[4. Dispatch to PaymentGatewayPort]
           ├──────────────────────────────┐
           ▼ (Gateway Approved)           ▼ (Gateway Declined / Error)
[5a. Mark Tx APPROVED]          [5b. Mark Tx DECLINED]
[5b. Assign Customer Delivery]  [5c. Release Reserved Stock]
[5c. Commit Stock Deduction]    [5d. Return 422 Payment Rejected]
           │
           ▼
[6. Return 200/201 Success Response with Transaction Summary]
```

---

## 5. PostgREST & PostgreSQL Persistence Strategy

- **Direct PostgreSQL or PostgREST Seam**:
  - The repository adapters communicate with PostgreSQL (via PostgREST HTTP REST API or typed connection pool `pg` / `TypeORM`).
  - Using Port interfaces ensures the application never binds to database specifics: if PostgREST is used, the repository adapter calls PostgREST endpoints; if direct SQL is used, the same interface is satisfied.
- **Atomic Stock Deduction**:
  Concurrency issues (two customers buying the last item at the exact same second) are prevented at the database engine level via atomic conditional updates:
  ```sql
  UPDATE products
  SET stock = stock - 1, updated_at = NOW()
  WHERE id = $1 AND stock > 0
  RETURNING stock;
  ```
  If zero rows are returned, the use case fails cleanly with `InsufficientStockError`.
