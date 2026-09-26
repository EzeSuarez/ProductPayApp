import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';

export interface CatalogState {
  products: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'productpay_catalog_state_v1';

const getInitialState = (): CatalogState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        products: [],
        selectedProduct: parsed.selectedProduct || null,
        isLoading: false,
        error: null,
      };
    }
  } catch {
    // Ignore localStorage errors
  }
  return {
    products: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
  };
};

const saveStateToStorage = (state: CatalogState) => {
  try {
    const dataToSave = {
      selectedProduct: state.selectedProduct,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch {
    // Ignore storage quota errors
  }
};

export const catalogSlice = createSlice({
  name: 'catalog',
  initialState: getInitialState(),
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
      saveStateToStorage(state);
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
        saveStateToStorage(state);
      }
    },
  },
});

export const { setProducts, setSelectedProduct, setLoading, setError, decrementStock } =
  catalogSlice.actions;

export default catalogSlice.reducer;
