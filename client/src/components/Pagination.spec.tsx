import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Pagination } from './Pagination';
import localeReducer from '../store/slices/localeSlice';

const renderPagination = (props: Partial<React.ComponentProps<typeof Pagination>> = {}) => {
  const store = configureStore({
    reducer: {
      locale: localeReducer,
    },
  });

  const defaultProps = {
    currentPage: 1,
    totalPages: 3,
    totalItems: 18,
    itemsPerPage: 6,
    onPageChange: jest.fn(),
  };

  return {
    ...render(
      <Provider store={store}>
        <Pagination {...defaultProps} {...props} />
      </Provider>
    ),
    defaultProps,
  };
};

describe('Pagination Component', () => {
  it('should render item range counter and page buttons', () => {
    renderPagination({ currentPage: 1 });

    expect(screen.getByText(/Mostrando 1–6 de 18 productos/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
  });

  it('should disable Previous button on first page and trigger onPageChange on page click', () => {
    const onPageChange = jest.fn();
    renderPagination({ currentPage: 1, onPageChange });

    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    expect(prevBtn).toBeDisabled();

    const page2Btn = screen.getByRole('button', { name: 'Page 2' });
    fireEvent.click(page2Btn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('should enable Previous button and disable Next button on the last page', () => {
    const onPageChange = jest.fn();
    renderPagination({ currentPage: 3, totalPages: 3, onPageChange });

    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    const nextBtn = screen.getByRole('button', { name: /Siguiente/i });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    fireEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
