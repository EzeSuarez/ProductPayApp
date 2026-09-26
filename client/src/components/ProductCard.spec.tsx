import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductCard } from './ProductCard';
import localeReducer from '../store/slices/localeSlice';
import { Product } from '../types';

const renderProductCard = (product: Product, onSelect: (p: Product) => void) => {
  const store = configureStore({
    reducer: {
      locale: localeReducer,
    },
  });

  return {
    ...render(
      <Provider store={store}>
        <ProductCard product={product} onSelect={onSelect} />
      </Provider>
    ),
    store,
  };
};

describe('ProductCard Component', () => {
  const mockProduct: Product = {
    id: 'prod-test-1',
    name: 'Sony WH-1000XM5',
    description: 'Noise canceling headphones',
    priceInCents: 145000000,
    stock: 5,
    imageUrl: 'https://example.com/headphones.jpg',
  };

  it('should render product information, stock badge, and Spanish button by default', () => {
    const handleSelect = jest.fn();
    renderProductCard(mockProduct, handleSelect);

    expect(screen.getByText('Sony WH-1000XM5')).toBeInTheDocument();
    expect(screen.getByText('Stock: 5')).toBeInTheDocument();
    expect(screen.getByText('Pagar con tarjeta de crédito')).toBeInTheDocument();
  });

  it('should call onSelect when pay button is clicked', () => {
    const handleSelect = jest.fn();
    renderProductCard(mockProduct, handleSelect);

    const payButton = screen.getByRole('button', { name: /Pagar con tarjeta de crédito/i });
    fireEvent.click(payButton);

    expect(handleSelect).toHaveBeenCalledWith(mockProduct);
  });

  it('should disable button and display Agotado when stock is 0', () => {
    const soldOutProduct: Product = {
      ...mockProduct,
      stock: 0,
    };
    const handleSelect = jest.fn();
    renderProductCard(soldOutProduct, handleSelect);

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    const payButton = screen.getByRole('button', { name: /Pagar con tarjeta de crédito/i });
    expect(payButton).toBeDisabled();

    fireEvent.click(payButton);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('should allow incrementing quantity and pass selected quantity to onSelect', () => {
    const handleSelect = jest.fn();
    renderProductCard(mockProduct, handleSelect);

    const increaseBtn = screen.getByRole('button', { name: /Aumentar cantidad/i });
    fireEvent.click(increaseBtn);

    const quantityDisplay = screen.getByTestId('quantity-value-prod-test-1');
    expect(quantityDisplay).toHaveTextContent('2');

    const payButton = screen.getByRole('button', { name: /Pagar con tarjeta de crédito/i });
    fireEvent.click(payButton);

    expect(handleSelect).toHaveBeenCalledWith(mockProduct, 2);
  });
});
