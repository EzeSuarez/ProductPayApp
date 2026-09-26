import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import localeReducer from '../store/slices/localeSlice';
import { useTranslation } from './useTranslation';

describe('useTranslation Hook', () => {
  const createWrapper = () => {
    const store = configureStore({
      reducer: {
        locale: localeReducer,
      },
    });

    const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <Provider store={store}>{children}</Provider>
    );

    return { Wrapper, store };
  };

  it('should return Spanish translations by default', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTranslation(), { wrapper: Wrapper });

    expect(result.current.language).toBe('es');
    expect(result.current.t.payWithCard).toBe('Pagar con tarjeta de crédito');
    expect(result.current.t.stepCounter(1, 4)).toBe('Paso 1/4');
    expect(result.current.t.stock(5)).toBe('Stock: 5');
  });

  it('should toggle language to English', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTranslation(), { wrapper: Wrapper });

    act(() => {
      result.current.toggleLanguage();
    });

    expect(result.current.language).toBe('en');
    expect(result.current.t.payWithCard).toBe('Pay with credit card');
    expect(result.current.t.stepCounter(1, 4)).toBe('Step 1/4');
    expect(result.current.t.stock(5)).toBe('Stock: 5');
  });

  it('should set specific language with setLanguage', () => {
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useTranslation(), { wrapper: Wrapper });

    act(() => {
      result.current.setLanguage('en');
    });

    expect(result.current.language).toBe('en');

    act(() => {
      result.current.setLanguage('es');
    });

    expect(result.current.language).toBe('es');
  });
});
