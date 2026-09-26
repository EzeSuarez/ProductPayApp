import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

describe('ProductCard Component', () => {
  const mockProduct: Product = {
    id: 'prod-test-1',
    name: 'Sony WH-1000XM5',
    description: 'Noise canceling headphones',
    priceInCents: 145000000,
    stock: 5,
    imageUrl: 'https://example.com/headphones.jpg',
  };

  it('should render product information and stock badge', () => {
    const handleSelect = jest.fn();
    render(<ProductCard product={mockProduct} onSelect={handleSelect} />);

    expect(screen.getByText('Sony WH-1000XM5')).toBeInTheDocument();
    expect(screen.getByText('Stock: 5')).toBeInTheDocument();
    expect(screen.getByText('Pay with credit card')).toBeInTheDocument();
  });

  it('should call onSelect when pay button is clicked', () => {
    const handleSelect = jest.fn();
    render(<ProductCard product={mockProduct} onSelect={handleSelect} />);

    const payButton = screen.getByRole('button', { name: /Pay with credit card/i });
    fireEvent.click(payButton);

    expect(handleSelect).toHaveBeenCalledWith(mockProduct);
  });

  it('should disable button and display Sold Out when stock is 0', () => {
    const soldOutProduct: Product = {
      ...mockProduct,
      stock: 0,
    };
    const handleSelect = jest.fn();
    render(<ProductCard product={soldOutProduct} onSelect={handleSelect} />);

    expect(screen.getByText('Sold Out')).toBeInTheDocument();
    const payButton = screen.getByRole('button', { name: /Pay with credit card/i });
    expect(payButton).toBeDisabled();

    fireEvent.click(payButton);
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
