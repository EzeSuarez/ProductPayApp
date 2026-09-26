import checkoutReducer, {
  setStep,
  updateCustomer,
  updateDelivery,
  setCardMetadata,
  setLegalAcceptance,
  setProcessing,
  setTransactionResult,
  resetCheckout,
  setError,
  CheckoutState,
} from './checkoutSlice';

describe('checkoutSlice reducer', () => {
  const getCleanState = (): CheckoutState => ({
    currentStep: 1,
    customer: { fullName: '', email: '', phoneNumber: '', legalId: '' },
    delivery: { addressLine1: '', addressLine2: '', city: 'Bogotá D.C.', region: 'Cundinamarca' },
    cardBrand: 'UNKNOWN',
    cardLastFour: '',
    cardToken: null,
    baseFeeInCents: 500000,
    deliveryFeeInCents: 1000000,
    termsAccepted: true,
    personalAuthAccepted: true,
    transaction: null,
    isProcessing: false,
    error: null,
  });

  it('should hydrate saved state from localStorage when present', () => {
    localStorage.setItem(
      'productpay_checkout_state_v1',
      JSON.stringify({
        currentStep: 3,
        customer: { fullName: 'Alice' },
        delivery: { city: 'Cali' },
        cardBrand: 'VISA',
        cardLastFour: '4242',
        termsAccepted: false,
        personalAuthAccepted: false,
        transaction: { id: 'tx-1' },
      })
    );

    // Re-require to trigger getInitialState()
    jest.isolateModules(() => {
      const slice = require('./checkoutSlice');
      const state = slice.default(undefined, { type: '@@INIT' });
      expect(state.currentStep).toBe(3);
      expect(state.customer.fullName).toBe('Alice');
      expect(state.delivery.city).toBe('Cali');
      expect(state.cardBrand).toBe('VISA');
      expect(state.cardLastFour).toBe('4242');
      expect(state.termsAccepted).toBe(false);
      expect(state.personalAuthAccepted).toBe(false);
      expect(state.transaction?.id).toBe('tx-1');
    });
  });

  it('should fallback to defaults when localStorage item is an empty object', () => {
    localStorage.setItem('productpay_checkout_state_v1', JSON.stringify({}));
    jest.isolateModules(() => {
      const slice = require('./checkoutSlice');
      const state = slice.default(undefined, { type: '@@INIT' });
      expect(state.currentStep).toBe(1);
      expect(state.customer.fullName).toBe('');
      expect(state.cardBrand).toBe('UNKNOWN');
      expect(state.termsAccepted).toBe(true);
    });
  });

  it('should handle setStep and persist to localStorage', () => {
    const state = checkoutReducer(getCleanState(), setStep(2));
    expect(state.currentStep).toBe(2);

    const saved = JSON.parse(localStorage.getItem('productpay_checkout_state_v1') || '{}');
    expect(saved.currentStep).toBe(2);
  });

  it('should handle updateCustomer', () => {
    const state = checkoutReducer(
      getCleanState(),
      updateCustomer({ fullName: 'John Doe', email: 'john@example.com' })
    );
    expect(state.customer.fullName).toBe('John Doe');
    expect(state.customer.email).toBe('john@example.com');
  });

  it('should handle updateDelivery', () => {
    const state = checkoutReducer(
      getCleanState(),
      updateDelivery({ addressLine1: 'Calle 100 # 15-20', city: 'Medellín' })
    );
    expect(state.delivery.addressLine1).toBe('Calle 100 # 15-20');
    expect(state.delivery.city).toBe('Medellín');
  });

  it('should handle setCardMetadata without sensitive card numbers', () => {
    const state = checkoutReducer(
      getCleanState(),
      setCardMetadata({ brand: 'VISA', lastFour: '4242', token: 'tok_test_123' })
    );
    expect(state.cardBrand).toBe('VISA');
    expect(state.cardLastFour).toBe('4242');
    expect(state.cardToken).toBe('tok_test_123');
  });

  it('should handle setLegalAcceptance with partial updates', () => {
    let state = checkoutReducer(
      getCleanState(),
      setLegalAcceptance({ termsAccepted: false })
    );
    expect(state.termsAccepted).toBe(false);
    expect(state.personalAuthAccepted).toBe(true);

    state = checkoutReducer(
      state,
      setLegalAcceptance({ personalAuthAccepted: false })
    );
    expect(state.personalAuthAccepted).toBe(false);
  });

  it('should handle setTransactionResult and transition to step 4', () => {
    const state = checkoutReducer(
      getCleanState(),
      setTransactionResult({
        id: 'tx-100',
        reference: 'TX-REF-1',
        status: 'APPROVED',
        amountInCents: 15500000,
      })
    );
    expect(state.currentStep).toBe(4);
    expect(state.transaction?.status).toBe('APPROVED');
    expect(state.transaction?.reference).toBe('TX-REF-1');
  });

  it('should handle resetCheckout and clear storage', () => {
    let state = checkoutReducer(getCleanState(), setStep(3));
    state = checkoutReducer(state, resetCheckout());

    expect(state.currentStep).toBe(1);
    expect(state.cardToken).toBeNull();
    expect(localStorage.getItem('productpay_checkout_state_v1')).toBeNull();
  });

  it('should handle setProcessing', () => {
    const state = checkoutReducer(getCleanState(), setProcessing(true));
    expect(state.isProcessing).toBe(true);
  });

  it('should handle corrupted localStorage gracefully', () => {
    localStorage.setItem('productpay_checkout_state_v1', '{corrupt json');
    jest.isolateModules(() => {
      const slice = require('./checkoutSlice');
      const state = slice.default(undefined, { type: '@@INIT' });
      expect(state.currentStep).toBe(1);
    });
  });

  it('should handle localStorage write errors gracefully', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    const state = checkoutReducer(getCleanState(), setStep(2));
    expect(state.currentStep).toBe(2);
  });
});
