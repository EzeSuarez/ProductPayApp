import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CreditCardModal } from './CreditCardModal';
import checkoutReducer from '../store/slices/checkoutSlice';
import catalogReducer from '../store/slices/catalogSlice';
import localeReducer from '../store/slices/localeSlice';
import { Product } from '../types';

const renderWithStore = (component: React.ReactElement, initialStep = 2) => {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
      catalog: catalogReducer,
      locale: localeReducer,
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

    expect(screen.queryByText(/Pago y Entrega|Payment & Delivery/i)).not.toBeInTheDocument();
  });

  it('should render form fields in Spanish by default when isOpen is true', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    expect(screen.getByText(/Pago y Entrega/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo Electrónico \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número de Tarjeta \*/i)).toBeInTheDocument();
  });

  it('should detect VISA and display Visa badge when starting with 4', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const cardInput = screen.getByLabelText(/Número de Tarjeta \*/i);
    fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4242' } });

    expect(screen.getByTestId('visa-badge')).toBeInTheDocument();
  });

  it('should detect MASTERCARD and display Mastercard badge when starting with 5', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const cardInput = screen.getByLabelText(/Número de Tarjeta \*/i);
    fireEvent.change(cardInput, { target: { value: '5555 5555 5555 4444' } });

    expect(screen.getByTestId('mastercard-badge')).toBeInTheDocument();
  });

  it('should show validation errors in Spanish when submitted empty', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const submitBtn = screen.getByRole('button', { name: /Continuar al Resumen/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('El nombre completo es requerido')).toBeInTheDocument();
  });

  it('should show Luhn error when invalid card number is entered', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    fireEvent.change(screen.getByLabelText(/Nombre Completo \*/i), {
      target: { value: 'Juan Perez' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico \*/i), {
      target: { value: 'juan@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono \/ Celular \*/i), {
      target: { value: '+573001234567' },
    });
    fireEvent.change(screen.getByLabelText(/Dirección Línea 1 \*/i), {
      target: { value: 'Calle 100' },
    });
    fireEvent.change(screen.getByLabelText(/Nombre en la Tarjeta \*/i), {
      target: { value: 'JUAN PEREZ' },
    });
    fireEvent.change(screen.getByLabelText(/Vencimiento \*/i), {
      target: { value: '12/28' },
    });
    fireEvent.change(screen.getByLabelText(/CVC \*/i), {
      target: { value: '123' },
    });

    // 16 digits that fail Luhn
    fireEvent.change(screen.getByLabelText(/Número de Tarjeta \*/i), {
      target: { value: '4111 1111 1111 1112' },
    });

    const submitBtn = screen.getByRole('button', { name: /Continuar al Resumen/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText('Número de tarjeta inválido (verificación Luhn falló)')
    ).toBeInTheDocument();
  });

  it('should advance to Step 3 when all inputs are valid', () => {
    const handleClose = jest.fn();
    const { store } = renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    fireEvent.change(screen.getByLabelText(/Nombre Completo \*/i), {
      target: { value: 'Juan Perez' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico \*/i), {
      target: { value: 'juan@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono \/ Celular \*/i), {
      target: { value: '+573001234567' },
    });
    fireEvent.change(screen.getByLabelText(/Dirección Línea 1 \*/i), {
      target: { value: 'Calle 100 # 15-20' },
    });
    fireEvent.change(screen.getByLabelText(/Número de Tarjeta \*/i), {
      target: { value: '4242 4242 4242 4242' },
    });
    fireEvent.change(screen.getByLabelText(/Nombre en la Tarjeta \*/i), {
      target: { value: 'JUAN PEREZ' },
    });
    fireEvent.change(screen.getByLabelText(/Vencimiento \*/i), {
      target: { value: '12/28' },
    });
    fireEvent.change(screen.getByLabelText(/CVC \*/i), {
      target: { value: '123' },
    });

    const submitBtn = screen.getByRole('button', { name: /Continuar al Resumen/i });
    fireEvent.click(submitBtn);

    expect(store.getState().checkout.currentStep).toBe(3);
    expect(store.getState().checkout.cardBrand).toBe('VISA');
    expect(store.getState().checkout.cardLastFour).toBe('4242');
  });

  it('should update optional fields and installment select', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const legalIdInput = screen.getByLabelText(/Documento de Identidad/i);
    fireEvent.change(legalIdInput, { target: { value: '12345678' } });

    const addr2Input = screen.getByLabelText(/Dirección Línea 2/i);
    fireEvent.change(addr2Input, { target: { value: 'Apto 402' } });

    const cityInput = screen.getByLabelText(/Ciudad \*/i);
    fireEvent.change(cityInput, { target: { value: 'Medellín' } });

    const regionInput = screen.getByLabelText(/Departamento \/ Región/i);
    fireEvent.change(regionInput, { target: { value: 'Antioquia' } });

    const postalInput = screen.getByLabelText(/Código Postal/i);
    fireEvent.change(postalInput, { target: { value: '050001' } });

    const installmentsSelect = screen.getByLabelText(/Cuotas/i);
    fireEvent.change(installmentsSelect, { target: { value: '3' } });

    expect(installmentsSelect).toHaveValue('3');
  });

  it('should validate unaccepted terms and privacy checkboxes', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const termsCheckbox = screen.getByLabelText(/Acepto los/i);
    const privacyCheckbox = screen.getByLabelText(/Autorizo el tratamiento/i);

    // Uncheck both
    fireEvent.click(termsCheckbox);
    fireEvent.click(privacyCheckbox);

    const submitBtn = screen.getByRole('button', { name: /Continuar al Resumen/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Debes aceptar los términos y condiciones')).toBeInTheDocument();
    expect(screen.getByText('Debes autorizar el tratamiento de datos personales')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    renderWithStore(
      <CreditCardModal isOpen={true} product={mockProduct} onClose={handleClose} />
    );

    const closeBtn = screen.getByLabelText(/Cerrar ventana de pago|Close checkout modal/i);
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
