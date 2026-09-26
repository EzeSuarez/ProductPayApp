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

  it('should render catalog products on initial load', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    await waitFor(() => {
      expect(
        screen.getByText('Sony WH-1000XM5 Wireless Headphones')
      ).toBeInTheDocument();
    });
  });

  it('should open checkout modal when Pay with credit card is clicked', async () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    const payButton = await screen.findByRole('button', {
      name: /Pay with credit card/i,
    });
    fireEvent.click(payButton);

    expect(screen.getByText(/Payment & Delivery/i)).toBeInTheDocument();
  });
});
