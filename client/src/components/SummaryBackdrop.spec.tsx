import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SummaryBackdrop } from './SummaryBackdrop';
import checkoutReducer from '../store/slices/checkoutSlice';
import catalogReducer from '../store/slices/catalogSlice';
import { Product } from '../types';

const renderWithStore = (component: React.ReactElement) => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
      catalog: catalogReducer,
    },
    preloadedState: {
      checkout: {
        currentStep: 3,
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
        transaction: null,
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

describe('SummaryBackdrop Component', () => {
  const mockProduct: Product = {
    id: 'prod-test-1',
    name: 'Apple Watch Series 9',
    description: 'Smartwatch',
    priceInCents: 215000000,
    stock: 8,
    imageUrl: 'https://example.com/watch.jpg',
  };

  it('should render itemized fee breakdown and grand total', () => {
    const handlePay = jest.fn();
    renderWithStore(
      <SummaryBackdrop product={mockProduct} onConfirmPayment={handlePay} isProcessing={false} />
    );

    expect(screen.getByText('Apple Watch Series 9')).toBeInTheDocument();
    expect(screen.getByText('Platform Base Fee')).toBeInTheDocument();
    expect(screen.getByText('Express Delivery Fee')).toBeInTheDocument();
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
  });

  it('should trigger onConfirmPayment when Confirm & Pay button is clicked', () => {
    const handlePay = jest.fn();
    renderWithStore(
      <SummaryBackdrop product={mockProduct} onConfirmPayment={handlePay} isProcessing={false} />
    );

    const payBtn = screen.getByRole('button', { name: /Confirm & Pay/i });
    fireEvent.click(payBtn);

    expect(handlePay).toHaveBeenCalledTimes(1);
  });

  it('should display loading state and disable button when isProcessing is true', () => {
    const handlePay = jest.fn();
    renderWithStore(
      <SummaryBackdrop product={mockProduct} onConfirmPayment={handlePay} isProcessing={true} />
    );

    expect(screen.getByText(/Processing Secure Payment.../i)).toBeInTheDocument();
    const payBtn = screen.getByRole('button', { name: /Processing Secure Payment.../i });
    expect(payBtn).toBeDisabled();
  });

  it('should return to Step 2 when Edit Info is clicked', () => {
    const handlePay = jest.fn();
    const { store } = renderWithStore(
      <SummaryBackdrop product={mockProduct} onConfirmPayment={handlePay} isProcessing={false} />
    );

    const editBtn = screen.getByRole('button', { name: /Edit Info/i });
    fireEvent.click(editBtn);

    expect(store.getState().checkout.currentStep).toBe(2);
  });
});
