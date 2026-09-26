import { store } from './index';

describe('Redux store', () => {
  it('should initialize with catalog and checkout reducers', () => {
    const state = store.getState();
    expect(state.catalog).toBeDefined();
    expect(state.checkout).toBeDefined();
    expect(state.checkout.currentStep).toBe(1);
    expect(state.catalog.products).toEqual([]);
  });
});
