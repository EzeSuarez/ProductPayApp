import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { StatusScreen } from './StatusScreen';
import checkoutReducer from '../store/slices/checkoutSlice';
import catalogReducer from '../store/slices/catalogSlice';
import localeReducer from '../store/slices/localeSlice';
import { Product, TransactionResult } from '../types';

const renderWithStore = (
  component: React.ReactElement,
  txResult: TransactionResult
) => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
      catalog: catalogReducer,
      locale: localeReducer,
    },
    preloadedState: {
      checkout: {
        currentStep: 4,
        customer: {
          fullName: 'Laura Gomez',
          email: 'laura@example.com',
          phoneNumber: '+573105556677',
          legalId: '52987654',
        },
        delivery: {
          addressLine1: 'Carrera 15 # 85-30',
          city: 'Bogotá D.C.',
          region: 'Cundinamarca',
          postalCode: '110221',
        },
        cardBrand: 'VISA',
        cardLastFour: '4242',
        cardToken: 'tok_test_4242_approved',
        baseFeeInCents: 500000,
        deliveryFeeInCents: 1000000,
        termsAccepted: true,
        personalAuthAccepted: true,
        transaction: txResult,
        isProcessing: false,
        error: null,
      },
    },
  });

  return {
    ...render(<Provider store={store}>{component}</Provider>),
    store,
  };
};

describe('StatusScreen Component', () => {
  const mockProduct: Product = {
    id: 'prod-test-1',
    name: 'Apple Watch Series 9',
    description: 'Smartwatch',
    priceInCents: 215000000,
    stock: 8,
    imageUrl: 'https://example.com/watch.jpg',
  };

  it('should render APPROVED state in Spanish with reference, tracking number and return button', () => {
    const handleFinish = jest.fn();
    const approvedTx: TransactionResult = {
      id: 'tx-app-1',
      reference: 'TX-REF-APPROVED-99',
      status: 'APPROVED',
      amountInCents: 216500000,
    };

    renderWithStore(
      <StatusScreen product={mockProduct} onFinishCheckout={handleFinish} />,
      approvedTx
    );

    expect(screen.getByText(/Pago Exitoso/i)).toBeInTheDocument();
    expect(screen.getByText('TX-REF-APPROVED-99')).toBeInTheDocument();
    expect(screen.getByText(/Número de Guía:/i)).toBeInTheDocument();

    const returnBtn = screen.getByRole('button', { name: /Volver a la Tienda/i });
    fireEvent.click(returnBtn);

    expect(handleFinish).toHaveBeenCalledTimes(1);
  });

  it('should render DECLINED state and transition back to Step 2 when Try Another Card is clicked', () => {
    const handleFinish = jest.fn();
    const declinedTx: TransactionResult = {
      id: 'tx-dec-1',
      reference: 'TX-REF-DECLINED-88',
      status: 'DECLINED',
      amountInCents: 216500000,
      errorMessage: 'Card was declined by issuing bank',
    };

    const { store } = renderWithStore(
      <StatusScreen product={mockProduct} onFinishCheckout={handleFinish} />,
      declinedTx
    );

    expect(screen.getByText('Pago Rechazado')).toBeInTheDocument();
    expect(screen.getByText('Card was declined by issuing bank')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: /Intentar con Otra Tarjeta/i });
    fireEvent.click(retryBtn);

    expect(store.getState().checkout.currentStep).toBe(2);
  });

  it('should call onFinishCheckout when Back to Store is clicked in declined state', () => {
    const handleFinish = jest.fn();
    const declinedTx: TransactionResult = {
      id: 'tx-dec-2',
      reference: 'TX-REF-DECLINED-77',
      status: 'DECLINED',
      amountInCents: 216500000,
    };

    renderWithStore(
      <StatusScreen product={mockProduct} onFinishCheckout={handleFinish} />,
      declinedTx
    );

    const backBtn = screen.getByRole('button', { name: /Volver a la Tienda/i });
    fireEvent.click(backBtn);

    expect(handleFinish).toHaveBeenCalledTimes(1);
  });
});
