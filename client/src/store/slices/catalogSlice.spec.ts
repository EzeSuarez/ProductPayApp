import catalogReducer, {
  setProducts,
  setSelectedProduct,
  setLoading,
  setError,
  decrementStock,
  CatalogState,
} from './catalogSlice';
import { Product } from '../../types';

describe('catalogSlice reducer', () => {
  const initialState: CatalogState = {
    products: [],
    selectedProduct: null,
    isLoading: false,
    error: null,
  };

  const sampleProduct: Product = {
    id: 'prod-1',
    name: 'Test Product',
    description: 'Desc',
    priceInCents: 10000000,
    stock: 5,
    imageUrl: 'https://example.com/p.jpg',
  };

  it('should handle setProducts', () => {
    const nextState = catalogReducer(initialState, setProducts([sampleProduct]));
    expect(nextState.products).toHaveLength(1);
    expect(nextState.products[0].name).toBe('Test Product');
    expect(nextState.isLoading).toBe(false);
  });

  it('should handle setSelectedProduct', () => {
    const nextState = catalogReducer(initialState, setSelectedProduct(sampleProduct));
    expect(nextState.selectedProduct?.id).toBe('prod-1');
  });

  it('should handle setLoading and setError', () => {
    let state = catalogReducer(initialState, setLoading(true));
    expect(state.isLoading).toBe(true);

    state = catalogReducer(state, setError('Failed to load'));
    expect(state.error).toBe('Failed to load');
    expect(state.isLoading).toBe(false);
  });

  it('should handle decrementStock for product list and selected product', () => {
    const stateWithProduct: CatalogState = {
      products: [{ ...sampleProduct, stock: 5 }],
      selectedProduct: { ...sampleProduct, stock: 5 },
      isLoading: false,
      error: null,
    };

    const nextState = catalogReducer(
      stateWithProduct,
      decrementStock({ productId: 'prod-1', quantity: 2 })
    );

    expect(nextState.products[0].stock).toBe(3);
    expect(nextState.selectedProduct?.stock).toBe(3);
  });
});
