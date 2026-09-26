import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';

describe('App Component (5-Step Checkout Orchestration)', () => {
  beforeEach(() => {
    // Mock global fetch
    global.fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: 'test-p1',
                  name: 'Sony WH-1000XM5 Wireless Headphones',
                  description: 'Noise canceling headphones',
                  priceInCents: 145000000,
                  stock: 10,
                  imageUrl: 'https://example.com/headphones.jpg',
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render catalog products on initial load in Spanish by default', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Sony WH-1000XM5 Wireless Headphones')
      ).toBeInTheDocument();
      expect(screen.getByText('Colección Seleccionada')).toBeInTheDocument();
      expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
    });
  });

  it('should open checkout modal when Pagar con tarjeta de crédito is clicked', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    const payButton = await screen.findByRole('button', {
      name: /Pagar con tarjeta de crédito/i,
    });
    fireEvent.click(payButton);

    expect(screen.getByText(/Pago y Entrega/i)).toBeInTheDocument();
  });

  it('should dynamically switch language to English when EN toggle is clicked', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    const enToggle = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enToggle);

    expect(screen.getByText('Featured Products')).toBeInTheDocument();
    expect(screen.getByText('Curated Collection')).toBeInTheDocument();

    const esToggle = screen.getByRole('button', { name: 'ES' });
    fireEvent.click(esToggle);

    expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
  });

  it('should fallback to FALLBACK_PRODUCTS if fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Sony WH-1000XM5 Wireless Headphones (Midnight Black)')).toBeInTheDocument();
    });
  });

  it('should progress through Step 3 (Summary), process payment to Step 4 (Status), and return to Step 1', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: 'test-p1',
                  name: 'Sony WH-1000XM5 Wireless Headphones',
                  description: 'Noise canceling headphones',
                  priceInCents: 145000000,
                  stock: 10,
                  imageUrl: 'https://example.com/headphones.jpg',
                },
              ],
            }),
        });
      }
      if (url.includes('/api/transactions/checkout')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                id: 'tx-test-123',
                transactionId: 'tx-test-123',
                reference: 'TX-REF-123',
                status: 'APPROVED',
                totalAmountInCents: 146500000,
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // 1. Select product to open Step 2 Modal
    const payButton = await screen.findByRole('button', {
      name: /Pagar con tarjeta de crédito/i,
    });
    fireEvent.click(payButton);

    expect(screen.getByText(/Pago y Entrega/i)).toBeInTheDocument();

    // Fill valid form fields
    fireEvent.change(screen.getByLabelText(/Nombre Completo \*/i), {
      target: { value: 'Carlos Ruiz' },
    });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico \*/i), {
      target: { value: 'carlos@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Teléfono \/ Celular \*/i), {
      target: { value: '+573009998877' },
    });
    fireEvent.change(screen.getByLabelText(/Dirección Línea 1 \*/i), {
      target: { value: 'Cra 7 # 72-01' },
    });
    fireEvent.change(screen.getByLabelText(/Número de Tarjeta \*/i), {
      target: { value: '4242 4242 4242 4242' },
    });
    fireEvent.change(screen.getByLabelText(/Nombre en la Tarjeta \*/i), {
      target: { value: 'CARLOS RUIZ' },
    });
    fireEvent.change(screen.getByLabelText(/Vencimiento \*/i), {
      target: { value: '11/29' },
    });
    fireEvent.change(screen.getByLabelText(/CVC \*/i), {
      target: { value: '789' },
    });

    // 2. Submit Step 2 to advance to Step 3 (SummaryBackdrop)
    const continueBtn = screen.getByRole('button', { name: /Continuar →/i });
    fireEvent.click(continueBtn);

    // 3. Confirm payment on Step 3 Summary
    const confirmPayBtn = await screen.findByRole('button', {
      name: /Confirmar y Pagar/i,
    });
    fireEvent.click(confirmPayBtn);

    // 4. Verify Step 4 (StatusScreen) displays approved transaction
    await waitFor(() => {
      expect(screen.getByText(/Pago Exitoso/i)).toBeInTheDocument();
      expect(screen.getByText('TX-REF-123')).toBeInTheDocument();
    });

    // 5. Click Return to Store to complete Step 5
    const returnStoreBtn = screen.getByRole('button', {
      name: /Volver a la Tienda/i,
    });
    fireEvent.click(returnStoreBtn);

    // Should be back at Step 1 Catalog
    await waitFor(() => {
      expect(screen.getByText('Productos Destacados')).toBeInTheDocument();
    });
  });
});
