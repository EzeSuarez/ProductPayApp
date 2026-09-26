---
name: react-frontend-standards
description: >-
  ReactJS & Redux coding standards for the ProductPayApp mobile-first SPA.
  Covers the 5-step checkout flow, Redux Toolkit / Flux state management,
  localStorage resilience (refresh persistence), credit card validation with
  brand detection (Visa/Mastercard), backdrop modal UX, and Jest/RTL unit testing (>80% coverage).
metadata:
  type: project
  stack: ReactJS / Redux Toolkit / TypeScript / Jest / RTL
  scope: Frontend Application & UX
---

# ReactJS & Redux — Frontend Standards

This document establishes the frontend architecture, state management conventions, mobile-first responsive guidelines, and testing requirements for the client SPA.

---

## 1. Core Principles & Business Process

The application is a mobile-oriented single-page app (SPA) executing a 5-step checkout sequence:

```
[1. Product Page] ──► [2. CC & Delivery Modal] ──► [3. Summary Backdrop] ──► [4. Final Status] ──► [5. Updated Store]
(Stock & Price)       (Validation & Logos)          (Base Fee + Shipping)     (Tx Result & Deliv)   (Stock Reflected)
```

### 1.1 Mobile-First Viewport Benchmark
- Primary benchmark: **iPhone SE (2020) — 1334 x 750px**.
- Layout must be strictly responsive across all screen sizes without horizontal scrollbars or elements breaking out of bounds (`overflow-x: hidden`).
- Use CSS Flexbox and Grid layouts; keep critical action buttons within the mobile thumb zone.

### 1.2 Luxury Monochrome (Black & White) Design System (TailwindCSS)
- **Palette**: Deep blacks (`#09090b`, `#121214`), stark whites (`#ffffff`), and subtle slate/zinc neutral tones (`#27272a`, `#52525b`, `#a1a1aa`).
- **Typography**: Ultra-clean sans-serif (`Inter` or system modern font) with high typographic hierarchy, uppercase tracker badges (`tracking-wider text-xs font-semibold`).
- **Surface Accents**: Delicate 1px borders (`border-zinc-800`), glassmorphic backdrop filters (`backdrop-blur-md bg-black/80`), subtle hover elevation, and smooth transitions (`transition-all duration-300 ease-out`).
- **Mobile Container**: Centered mobile viewport container (`max-w-md mx-auto min-h-screen border-x border-zinc-800/40`) to maintain a polished app-like feel on desktop while serving native mobile viewports flawlessly.

### 1.3 State Resilience (Refresh Recovery)
- If the customer reloads the browser at Step 2 or 3, their checkout progress (selected product, delivery details, current step) must be **hydrated from `localStorage`**.
- Sensitive card details (PAN and CVV) must **never** be persisted to `localStorage`. Only non-sensitive state (step index, product ID, delivery address, customer name/email, transaction reference) is preserved.

---

## 2. Redux State Architecture (Flux Alignment)

State is organized into clean Redux Toolkit slices:

```typescript
// store/slices/checkout.slice.ts
export interface CheckoutState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  selectedProductId: string | null;
  customer: {
    fullName: string;
    email: string;
    phoneNumber: string;
    legalId: string;
  };
  delivery: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    postalCode?: string;
  };
  fees: {
    baseFeeInCents: number;     // e.g. 5,000 COP
    deliveryFeeInCents: number; // e.g. 10,000 COP
  };
  transaction: {
    reference: string | null;
    status: 'IDLE' | 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
    externalId: string | null;
    errorMessage: string | null;
  };
  isLoading: boolean;
}
```

---

## 3. Credit Card Validation & Brand Detection

The checkout modal validates card structure and dynamically detects card brand logos:

```typescript
export type CardBrand = 'VISA' | 'MASTERCARD' | 'UNKNOWN';

export const detectCardBrand = (cardNumber: string): CardBrand => {
  const sanitized = cardNumber.replace(/\D/g, '');
  if (/^4[0-9]{0,15}$/.test(sanitized)) return 'VISA';
  if (/^(5[1-5][0-9]{0,14}|2(22[1-9][0-9]{0,12}|2[3-9][0-9]{0,13}|[3-6][0-9]{0,14}|7[0-1][0-9]{0,13}|720[0-9]{0,12}))$/.test(sanitized)) {
    return 'MASTERCARD';
  }
  return 'UNKNOWN';
};

// Luhn Algorithm for structural validity
export const validateLuhn = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};
```

---

## 4. UI/UX Backdrop Component (Material Design Pattern)

As specified in the challenge, Step 3 displays the summary in a **Backdrop component**:
- The front layer holds the active payment button and grand total.
- The back layer reveals the itemized fee breakdown:
  - Product price
  - Base fee (always added)
  - Delivery fee
  - Grand total
- Smooth slide/fade transitions using CSS animations.

---

## 5. Frontend Unit Testing Standards (Jest & React Testing Library)

Mandatory **>80% test coverage** requirement:
- Test step navigation forward and backward.
- Test form validation (invalid card numbers, empty delivery fields, invalid email format).
- Test card brand detection hook and logo rendering.
- Test localStorage persistence and recovery on reload.
- Test Redux actions, reducers, and async thunks with mocked API responses.

```typescript
describe('CreditCardModal', () => {
  it('should detect Mastercard and display Mastercard logo when valid BIN is typed', () => {
    renderWithStore(<CreditCardModal isOpen={true} />);
    const cardInput = screen.getByLabelText(/Card Number/i);
    
    fireEvent.change(cardInput, { target: { value: '5555555555554444' } });
    
    expect(screen.getByAltText(/MasterCard Logo/i)).toBeInTheDocument();
  });
});
```
