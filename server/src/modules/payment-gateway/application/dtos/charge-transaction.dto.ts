export interface ChargeTransactionDto {
  amountInCents: number;
  currency: string;
  reference: string;
  customerEmail: string;
  cardToken: string;
  acceptanceToken: string;
  acceptPersonalAuth: string;
  installments?: number;
}

export interface ChargeResultDto {
  externalId: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  reference: string;
}

export interface MerchantAcceptanceDto {
  acceptanceToken: string;
  acceptancePermalink: string;
  personalAuthToken: string;
  personalAuthPermalink: string;
}
