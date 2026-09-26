export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrl: string;
}

export type CardBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'UNKNOWN';

export interface CustomerData {
  fullName: string;
  email: string;
  phoneNumber: string;
  legalId: string;
}

export interface DeliveryData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode?: string;
}

export interface CreditCardData {
  cardNumber: string;
  cardHolder: string;
  expMonth: string;
  expYear: string;
  cvc: string;
}

export interface FeeStructure {
  baseFeeInCents: number;
  deliveryFeeInCents: number;
}

export type TransactionStatus = 'IDLE' | 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

export interface TransactionResult {
  id: string;
  reference: string;
  status: TransactionStatus;
  amountInCents: number;
  errorMessage?: string;
}
