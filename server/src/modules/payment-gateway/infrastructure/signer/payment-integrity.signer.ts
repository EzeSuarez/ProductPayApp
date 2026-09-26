import { createHash } from 'crypto';

export class PaymentIntegritySigner {
  static generateSignature(
    reference: string,
    amountInCents: number,
    currency: string,
    integritySecret: string
  ): string {
    const rawString = `${reference}${amountInCents}${currency}${integritySecret}`;
    return createHash('sha256').update(rawString, 'utf8').digest('hex');
  }
}
