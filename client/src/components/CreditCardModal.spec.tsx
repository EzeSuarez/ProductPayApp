import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CreditCardModal } from './CreditCardModal';
import checkoutReducer from '../store/slices/checkoutSlice';
import catalogReducer from '../store/slices/catalogSlice';
import { Product } from '../types';

const renderWithStore = (component: React.ReactElement, initialStep = 2) => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
      catalog: catalogReducer,
    },
    preloadedState: {
      checkout: {
        currentStep: initialStep as any,
        customer: { fullName: '', email: '', phoneNumber: '', legalId: '' },
        delivery: {
          addressLine1: '',
          addressLine2: '',
          city: 'Bogotá D.C.',
          region: 'Cundinamarca',
          postalCode: '110111',
        },
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
      },
    },
  });

  return {
    ...render(<Provider store={store}>{component}</Provider>),
    store,
  };
};

describe('CreditCardModal Component', () => {
  const mockProduct: Product = {
    id: 'prod-test-1',
    name: 'Sony WH-1000XM5',
    description: 'Noise canceling headphones',
    priceInCents: 145000000,
    stock: 5,
    imageUrl: 'https://example.com/headphones.jpg',
  };

  it('should not render anything when isOpen is false', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={false} product={mockProduct} onClose={handleClose} />
    );

    expect(screen.queryByText(/Payment & Delivery/i)).not.toBeInTheDocument();
  });

  it('should render form fields when isOpen is true', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    expect(screen.getByText(/Payment & Delivery/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Card Number \*/i)).toBeInTheDocument();
  });

  it('should detect VISA and display Visa badge when starting with 4', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const cardInput = screen.getByLabelText(/Card Number \*/i);
    fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4242' } });

    expect(screen.getByTestId('visa-badge')).toBeInTheDocument();
  });

  it('should detect MASTERCARD and display Mastercard badge when starting with 5', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const cardInput = screen.getByLabelText(/Card Number \*/i);
    fireEvent.change(cardInput, { target: { value: '5555 5555 5555 4444' } });

    expect(screen.getByTestId('mastercard-badge')).toBeInTheDocument();
  });

  it('should show validation errors when submitted empty', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const submitBtn = screen.getByRole('button', { name: /Continue to Summary/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Full name is required')).toBeInTheDocument();
  });

  it('should show Luhn error when invalid card number is entered', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    fireEvent.change(screen.getByLabelText(/Full Name \*/i), {
      target: { value: 'Juan Perez' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), {
      target: { value: 'juan@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number \*/i), {
      target: { value: '+573001234567' },
    });
    fireEvent.change(screen.getByLabelText(/Address Line 1 \*/i), {
      target: { value: 'Calle 100' },
    });
    fireEvent.change(screen.getByLabelText(/Cardholder Name \*/i), {
      target: { value: 'JUAN PEREZ' },
    });
    fireEvent.change(screen.getByLabelText(/Expiry \*/i), {
      target: { value: '12/28' },
    });
    fireEvent.change(screen.getByLabelText(/CVC \*/i), {
      target: { value: '123' },
    });

    // 16 digits that fail Luhn
    fireEvent.change(screen.getByLabelText(/Card Number \*/i), {
      target: { value: '4111 1111 1111 1112' },
    });

    const submitBtn = screen.getByRole('button', { name: /Continue to Summary/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText('Invalid credit card number (Luhn check failed)')
    ).toBeInTheDocument();
  });

  it('should advance to Step 3 when all inputs are valid', () => {
    const handleClose = jest.fn();
    const { store } = renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    fireEvent.change(screen.getByLabelText(/Full Name \*/i), {
      target: { value: 'Juan Perez' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address \*/i), {
      target: { value: 'juan@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number \*/i), {
      target: { value: '+573001234567' },
    });
    fireEvent.change(screen.getByLabelText(/Address Line 1 \*/i), {
      target: { value: 'Calle 100 # 15-20' },
    });
    fireEvent.change(screen.getByLabelText(/Card Number \*/i), {
      target: { value: '4242 4242 4242 4242' },
    });
    fireEvent.change(screen.getByLabelText(/Cardholder Name \*/i), {
      target: { value: 'JUAN PEREZ' },
    });
    fireEvent.change(screen.getByLabelText(/Expiry \*/i), {
      target: { value: '12/28' },
    });
    fireEvent.change(screen.getByLabelText(/CVC \*/i), {
      target: { value: '123' },
    });

    const submitBtn = screen.getByRole('button', { name: /Continue to Summary/i });
    fireEvent.click(submitBtn);

    expect(store.getState().checkout.currentStep).toBe(3);
    expect(store.getState().checkout.cardBrand).toBe('VISA');
    expect(store.getState().checkout.cardLastFour).toBe('4242');
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const closeBtn = screen.getByLabelText(/Close checkout modal/i);
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
