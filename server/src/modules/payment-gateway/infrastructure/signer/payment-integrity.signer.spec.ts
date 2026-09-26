import { PaymentIntegritySigner } from './payment-integrity.signer';
import { createHash } from 'crypto';

describe('PaymentIntegritySigner', () => {
  it('should generate valid SHA-256 hex digest for reference, amount, currency, and secret', () => {
    const reference = 'ORDER-12345';
    const amountInCents = 15000000;
    const currency = 'COP';
    const secret = 'stagtest_integrity_nAIBuqayW70XpUqJS4qf4STYiISd89Fp';

    const expected = createHash('sha256')
      .update(`${reference}${amountInCents}${currency}${secret}`, 'utf8')
      .digest('hex');

    const result = PaymentIntegritySigner.generateSignature(
      reference,
      amountInCents,
      currency,
      secret
    );

    expect(result).toBe(expected);
    expect(result).toHaveLength(64); // SHA-256 hex is 64 chars
  });
});
