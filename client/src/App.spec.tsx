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
});
