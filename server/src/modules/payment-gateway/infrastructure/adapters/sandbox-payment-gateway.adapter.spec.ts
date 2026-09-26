import { SandboxPaymentGatewayAdapter } from './sandbox-payment-gateway.adapter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SandboxPaymentGatewayAdapter', () => {
  let adapter: SandboxPaymentGatewayAdapter;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string, defaultVal: string) => defaultVal) as any,
    };
    adapter = new SandboxPaymentGatewayAdapter(mockConfigService as ConfigService);
  });

  describe('fetchMerchantAcceptanceTokens', () => {
    it('should return acceptance tokens from primary endpoint', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'tok_acc_1',
              permalink: 'https://example.com/terms.pdf',
            },
            presigned_personal_data_auth: {
              acceptance_token: 'tok_auth_1',
              permalink: 'https://example.com/privacy.pdf',
            },
          },
        },
      });

      const result = await adapter.fetchMerchantAcceptanceTokens();
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.acceptanceToken).toBe('tok_acc_1');
        expect(result.value.personalAuthToken).toBe('tok_auth_1');
      }
    });

    it('should fallback to simulated tokens if endpoints fail', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network offline'));

      const result = await adapter.fetchMerchantAcceptanceTokens();
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.acceptanceToken).toBe('simulated_acceptance_token_uat_sandbox');
      }
    });
  });

  describe('processCardCharge', () => {
    const chargeDto = {
      amountInCents: 145000000,
      currency: 'COP',
      reference: 'TX-REF-100',
      customerEmail: 'test@example.com',
      cardToken: 'tok_test_4242_approved',
      acceptanceToken: 'acc_token',
      acceptPersonalAuth: 'auth_token',
    };

    it('should process card charge successfully via gateway POST /transactions', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'gw-tx-1234',
            status: 'APPROVED',
            reference: 'TX-REF-100',
          },
        },
      });

      const result = await adapter.processCardCharge(chargeDto);
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.externalId).toBe('gw-tx-1234');
        expect(result.value.status).toBe('APPROVED');
        expect(result.value.reference).toBe('TX-REF-100');
      }
    });

    it('should simulate APPROVED status for test card in offline sandbox mode', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Offline'));

      const result = await adapter.processCardCharge(chargeDto);
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.status).toBe('APPROVED');
      }
    });

    it('should simulate DECLINED status for 4111 card in offline mode', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Offline'));

      const declinedDto = { ...chargeDto, cardToken: 'tok_test_4111_declined' };
      const result = await adapter.processCardCharge(declinedDto);
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.status).toBe('DECLINED');
      }
    });
  });

  describe('getTransactionStatus', () => {
    it('should fetch status by external transaction id', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 'gw-tx-999',
            status: 'APPROVED',
            reference: 'TX-REF-999',
          },
        },
      });

      const result = await adapter.getTransactionStatus('gw-tx-999');
      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value.externalId).toBe('gw-tx-999');
        expect(result.value.status).toBe('APPROVED');
      }
    });

    it('should fail when transaction status query fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Gateway error 500'));

      const result = await adapter.getTransactionStatus('gw-tx-none');
      expect(result.isFail).toBe(true);
    });
  });
});
