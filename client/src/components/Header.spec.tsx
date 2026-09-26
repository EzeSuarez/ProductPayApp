import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Header } from './Header';
import localeReducer from '../store/slices/localeSlice';

const renderHeader = (currentStep = 1) => {
  const store = configureStore({
    reducer: {
      locale: localeReducer,
    },
  });

  return {
    ...render(
      <Provider store={store}>
        <Header currentStep={currentStep} />
      </Provider>
    ),
    store,
  };
};

describe('Header Component', () => {
  it('should render brand title, sandbox badge, and language selector in Spanish by default', () => {
    renderHeader(1);

    expect(screen.getByText('ProductPay')).toBeInTheDocument();
    expect(screen.getByText(/UAT SANDBOX/i)).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('should display Spanish step counter when currentStep > 1', () => {
    renderHeader(3);

    expect(screen.getByText('Paso 3/4')).toBeInTheDocument();
  });

  it('should switch to English when clicking EN button', () => {
    renderHeader(2);

    expect(screen.getByText('Paso 2/4')).toBeInTheDocument();
    const enButton = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enButton);

    expect(screen.getByText('Step 2/4')).toBeInTheDocument();
  });
});
