import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CustomerData, DeliveryData, TransactionResult, TransactionStatus } from '../../types';

export interface CheckoutState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  customer: CustomerData;
  delivery: DeliveryData;
  cardBrand: string;
  cardLastFour: string;
  cardToken: string | null;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  termsAccepted: boolean;
  personalAuthAccepted: boolean;
  transaction: TransactionResult | null;
  isProcessing: boolean;
  error: string | null;
}

const STORAGE_KEY = 'productpay_checkout_state_v1';

const getInitialState = (): CheckoutState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentStep: parsed.currentStep || 1,
        customer: parsed.customer || { fullName: '', email: '', phoneNumber: '', legalId: '' },
        delivery: parsed.delivery || { addressLine1: '', addressLine2: '', city: 'Bogotá D.C.', region: 'Cundinamarca', postalCode: '110111' },
        cardBrand: parsed.cardBrand || 'UNKNOWN',
        cardLastFour: parsed.cardLastFour || '',
        cardToken: parsed.cardToken || null,
        baseFeeInCents: 500000,    // 5,000 COP
        deliveryFeeInCents: 1000000, // 10,000 COP
        termsAccepted: parsed.termsAccepted ?? true,
        personalAuthAccepted: parsed.personalAuthAccepted ?? true,
        transaction: parsed.transaction || null,
        isProcessing: false,
        error: null,
      };
    }
  } catch {
    // Ignore localStorage errors
  }

  return {
    currentStep: 1,
    customer: { fullName: '', email: '', phoneNumber: '', legalId: '' },
    delivery: { addressLine1: '', addressLine2: '', city: 'Bogotá D.C.', region: 'Cundinamarca', postalCode: '110111' },
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
  };
};

const saveStateToStorage = (state: CheckoutState) => {
  try {
    const dataToSave = {
      currentStep: state.currentStep,
      customer: state.customer,
      delivery: state.delivery,
      cardBrand: state.cardBrand,
      cardLastFour: state.cardLastFour,
      cardToken: state.cardToken,
      termsAccepted: state.termsAccepted,
      personalAuthAccepted: state.personalAuthAccepted,
      transaction: state.transaction,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch {
    // Ignore storage quota errors
  }
};

export const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: getInitialState(),
  reducers: {
    setStep: (state, action: PayloadAction<1 | 2 | 3 | 4 | 5>) => {
      state.currentStep = action.payload;
      saveStateToStorage(state);
    },
    updateCustomer: (state, action: PayloadAction<Partial<CustomerData>>) => {
      state.customer = { ...state.customer, ...action.payload };
      saveStateToStorage(state);
    },
    updateDelivery: (state, action: PayloadAction<Partial<DeliveryData>>) => {
      state.delivery = { ...state.delivery, ...action.payload };
      saveStateToStorage(state);
    },
    setCardMetadata: (
      state,
      action: PayloadAction<{ brand: string; lastFour: string; token?: string }>
    ) => {
      state.cardBrand = action.payload.brand;
      state.cardLastFour = action.payload.lastFour;
      if (action.payload.token) {
        state.cardToken = action.payload.token;
      }
      saveStateToStorage(state);
    },
    setLegalAcceptance: (
      state,
      action: PayloadAction<{ termsAccepted?: boolean; personalAuthAccepted?: boolean }>
    ) => {
      if (action.payload.termsAccepted !== undefined) {
        state.termsAccepted = action.payload.termsAccepted;
      }
      if (action.payload.personalAuthAccepted !== undefined) {
        state.personalAuthAccepted = action.payload.personalAuthAccepted;
      }
      saveStateToStorage(state);
    },
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    setTransactionResult: (state, action: PayloadAction<TransactionResult>) => {
      state.transaction = action.payload;
      state.isProcessing = false;
      state.currentStep = 4; // Move to status screen
      saveStateToStorage(state);
    },
    resetCheckout: (state) => {
      state.currentStep = 1;
      state.cardToken = null;
      state.cardLastFour = '';
      state.cardBrand = 'UNKNOWN';
      state.transaction = null;
      state.error = null;
      state.isProcessing = false;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isProcessing = false;
    },
  },
});

export const {
  setStep,
  updateCustomer,
  updateDelivery,
  setCardMetadata,
  setLegalAcceptance,
  setProcessing,
  setTransactionResult,
  resetCheckout,
  setError,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
