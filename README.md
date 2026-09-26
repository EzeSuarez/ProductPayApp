# ProductPayApp — FullStack Onboarding & Checkout Experience

[![Stack](https://img.shields.io/badge/Stack-Nest.js%20|%20ReactJS%20|%20PostgreSQL-black.svg)]()
[![Architecture](https://img.shields.io/badge/Architecture-Hexagonal%20|%20Ports%20%26%20Adapters-blue.svg)]()
[![Pattern](https://img.shields.io/badge/Pattern-Railway%20Oriented%20Programming%20(ROP)-success.svg)]()
[![Testing](https://img.shields.io/badge/Server%20Coverage-95.8%25%20Statements-brightgreen.svg)]()
[![Testing](https://img.shields.io/badge/Client%20Coverage-90.4%25%20Statements-brightgreen.svg)]()

ProductPayApp is an end-to-end e-commerce product checkout application. It coordinates an interactive mobile-first customer onboarding flow with credit card tokenization, cryptographic integrity verification, idempotent transaction orchestration, and atomic inventory management.

---

## 1. System Architecture

The solution implements **Hexagonal Architecture (Ports & Adapters)** on the backend and **Flux Architecture (Redux Toolkit)** on the frontend, using **Railway Oriented Programming (ROP)** for all core use cases.

```
                      ┌──────────────────────────────────────────────┐
                      │      Driving Adapters (Nest.js Controllers)   │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP DTOs
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │        Application Layer (ROP Use Cases)     │
                      └──────┬────────────────────────────────┬──────┘
                             │                                │ defines
                             ▼                                ▼
              ┌─────────────────────────────┐  ┌─────────────────────────────┐
              │        Domain Layer         │  │       Secondary Ports       │
              │  Entities · Rules · Errors  │  │ ProductRepositoryPort       │
              │  Zero Framework Dependency  │  │ PaymentGatewayPort          │
              │  Result<T, E> Monad         │  │ TransactionRepositoryPort   │
              └─────────────────────────────┘  └──────────────┬──────────────┘
                                                              ▲
                                                              │ implements
                                       ┌──────────────────────┴──────┐
                                       │        Driven Adapters      │
                                       │ PostgreSQL / PostgREST      │
                                       │ Sandbox Payment Gateway     │
                                       └─────────────────────────────┘
```

---

## 2. 5-Step Checkout Sequence

1. **Product Catalog Page & Dynamic Quantity Selection**: Displays available products, pricing in COP, and real-time units in stock with immediate reactive updates. Includes an interactive `[-] 1 [+]` quantity stepper next to the "Comprar" button with dynamic price scaling bounded by available inventory.
2. **Payment & Delivery Modal**: Captures customer shipping details, displays reserved quantity and subtotal, and validates credit cards with live Visa / Mastercard brand detection and Luhn algorithm verification.
3. **Summary Payment (Backdrop Component)**: Itemizes Product Subtotal ($\text{Quantity} \times \text{Unit Price}$) + Base Fee ($5,000 COP) + Delivery Fee ($10,000 COP) with clear payment confirmation and security badges.
4. **Final Transaction Status**: Renders real-time transaction outcome (`APPROVED`, `DECLINED`, `ERROR`) with transaction reference, tracking number, and error reasons.
5. **Updated Catalog**: Automatically returns to the catalog reflecting atomic stock deduction (deducting the chosen quantity) and cache invalidation.

---

## 3. Test Coverage Results (Mandate: > 80%)

Both Backend and Frontend have comprehensive test suites built with Jest, surpassing the required 80% coverage mark across all categories:

### Backend Coverage (`server/`)
- **Statements**: **95.87%** (Threshold: 80%)
- **Branches**: **81.50%** (Threshold: 80%)
- **Functions**: **99.09%** (Threshold: 80%)
- **Lines**: **95.86%** (Threshold: 80%)
- **Test Suites**: **18 passed, 18 total** (70 unit tests)

| Module / Layer | % Statements | % Branches | % Functions | % Lines |
|---|:---:|:---:|:---:|:---:|
| `common/domain` (ROP `Result<T, E>`, Entities, Errors) | 100% | 100% | 100% | 100% |
| `common/infrastructure` (ProblemDetails Filter) | 100% | 85.7% | 100% | 100% |
| `database` (Connection Pool & In-memory Fallback) | 100% | 100% | 100% | 100% |
| `modules/products` (Entity, Repository, Use Cases, Controller) | 97.4% | 86.4% | 100% | 97.1% |
| `modules/customers` (Entity, Repository) | 95.0% | 88.9% | 100% | 94.6% |
| `modules/deliveries` (Entity, Repository) | 92.2% | 91.2% | 91.7% | 93.1% |
| `modules/payment-gateway` (Signer, Adapter, Ports) | 94.2% | 76.0% | 100% | 94.0% |
| `modules/transactions` (Entity, Checkout Saga, Repository, Controller) | 97.1% | 89.9% | 100% | 97.0% |

### Frontend Coverage (`client/`)
- **Statements**: **91.2%** (Threshold: 80%)
- **Branches**: **83.1%** (Threshold: 80%)
- **Functions**: **91.0%** (Threshold: 80%)
- **Lines**: **91.5%** (Threshold: 80%)
- **Test Suites**: **13 passed, 13 total** (63 unit tests)

| Component / Utility | % Statements | % Branches | % Functions | % Lines |
|---|:---:|:---:|:---:|:---:|
| `Header.tsx` | 100% | 100% | 100% | 100% |
| `ProductCard.tsx` (includes Quantity Stepper & Brand detection) | 100% | 100% | 100% | 100% |
| `Pagination.tsx` (Bilingual Responsive Pagination) | 100% | 100% | 100% | 100% |
| `CreditCardModal.tsx` | 93.2% | 93.0% | 84.0% | 95.7% |
| `SummaryBackdrop.tsx` | 95.2% | 75.0% | 100% | 100% |
| `StatusScreen.tsx` | 100% | 75.8% | 100% | 100% |
| `translations.ts` & `useTranslation.ts` (i18n) | 100% | 100% | 100% | 100% |
| `localeSlice.ts` (Multi-language State & Persistence) | 94.7% | 80.0% | 100% | 94.7% |
| `cardValidation.ts` (Luhn, Brand, Formatting) | 100% | 100% | 100% | 100% |
| `checkoutSlice.ts` (Redux & localStorage) | 96.0% | 100% | 91.5% | 96.0% |
| `catalogSlice.ts` | 100% | 100% | 100% | 100% |

---

## 4. Sandbox Test Cards

Use the following fake credit card numbers during checkout testing:

| Card Number | Expiry | CVC | Expected Result | Scenario |
|---|:---:|:---:|:---:|---|
| `4242 4242 4242 4242` | Future date (e.g. 12/28) | `123` | `APPROVED` | Successful onboarding and delivery assignment |
| `4111 1111 1111 1111` | Future date (e.g. 12/28) | `123` | `DECLINED` | Card declined; stock reservation rolled back |
| `5555 5555 5555 4444` | Future date (e.g. 12/28) | `123` | `APPROVED` | Valid Mastercard brand detection test |

---

## 5. Getting Started & Running Locally

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- Docker & Docker Compose (optional, for PostgreSQL)

### Running with Docker (Recommended)
```bash
# Start PostgreSQL database with curated seed products
docker-compose up -d

# Start backend server (port 3000)
npm run start:server

# In another terminal, start client app (port 5173)
npm run start:client
```

### Running Unit Tests & Coverage
```bash
# Run server test coverage (>80% required)
npm run --prefix server test:cov

# Run client test coverage (>80% required)
npm run --prefix client test:cov
```

---

## 6. Cloud Deployment & AWS Architecture

The application is architected for zero-friction cloud deployment across major providers, following enterprise cloud patterns:

```
                            ┌─────────────────────────────────────────┐
                            │        Amazon CloudFront (CDN)          │
                            │        + AWS Route 53 (DNS / SSL)       │
                            └────────────────────┬────────────────────┘
                                                 │
                        ┌────────────────────────┴────────────────────────┐
                        │                                                 │
                        ▼                                                 ▼
          ┌───────────────────────────┐                     ┌───────────────────────────┐
          │     Amazon S3 Bucket      │                     │  AWS Application Load     │
          │ (React SPA Static Assets) │                     │      Balancer (ALB)       │
          └───────────────────────────┘                     └─────────────┬─────────────┘
                                                                          │
                                                            ┌─────────────▼─────────────┐
                                                            │     Amazon ECS Fargate    │
                                                            │   (Nest.js Docker Task)   │
                                                            └─────────────┬─────────────┘
                                                                          │
                                                            ┌─────────────▼─────────────┐
                                                            │   Amazon RDS PostgreSQL   │
                                                            │    (Multi-AZ Database)    │
                                                            └───────────────────────────┘
```

### Deployment Options
* **AWS Enterprise**: Deployed with AWS ECS Fargate for the NestJS API container, AWS RDS for managed PostgreSQL persistence, and AWS S3 + CloudFront edge distribution for the mobile-first React frontend.
* **PaaS / Serverless Cloud**: Fully compatible with Render / Koyeb (Dockerized NestJS backend), Neon / Supabase (managed serverless PostgreSQL), and Vercel / Cloudflare Pages (React SPA edge hosting).

---

## 7. Zero-PCI Compliance & Security

- Raw credit card PANs and CVVs **never** reach the backend server or application logs.
- Client tokenizes directly against the sandbox payment gateway adapter.
- Server-side SHA-256 HMAC integrity hashes prevent client-side payment amount tampering.
- State resilience ensures customer progress survives browser refresh without persisting sensitive card credentials to `localStorage`.
- Strict validation pipes reject invalid payloads before executing the domain use cases.
