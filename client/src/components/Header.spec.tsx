import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

describe('Header Component', () => {
  it('should render brand title and sandbox badge', () => {
    render(<Header currentStep={1} />);

    expect(screen.getByText('ProductPay')).toBeInTheDocument();
    expect(screen.getByText(/UAT SANDBOX/i)).toBeInTheDocument();
  });

  it('should display step counter when currentStep > 1', () => {
    render(<Header currentStep={3} />);

    expect(screen.getByText('Step 3/4')).toBeInTheDocument();
  });
});
