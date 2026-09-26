import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';

export interface CatalogState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CatalogState = {
  products: [],
  selectedProduct: null,
  isLoading: false,
  error: null,
};

export const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    decrementStock: (state, action: PayloadAction<{ productId: string; quantity: number }>) => {
      const product = state.products.find((p) => p.id === action.payload.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - action.payload.quantity);
      }
      if (state.selectedProduct && state.selectedProduct.id === action.payload.productId) {
        state.selectedProduct.stock = Math.max(0, state.selectedProduct.stock - action.payload.quantity);
      }
    },
  },
});

export const { setProducts, setSelectedProduct, setLoading, setError, decrementStock } =
  catalogSlice.actions;

export default catalogSlice.reducer;
