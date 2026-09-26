import localeReducer, { setLanguage, toggleLanguage } from './localeSlice';

describe('localeSlice', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to Spanish (es)', () => {
    const state = localeReducer(undefined, { type: 'unknown' });
    expect(state.language).toBe('es');
  });

  it('should allow setting language to en', () => {
    const state = localeReducer({ language: 'es' }, setLanguage('en'));
    expect(state.language).toBe('en');
    expect(localStorage.getItem('productpay_language_v1')).toBe('en');
  });

  it('should toggle language between es and en', () => {
    let state = localeReducer({ language: 'es' }, toggleLanguage());
    expect(state.language).toBe('en');
    expect(localStorage.getItem('productpay_language_v1')).toBe('en');

    state = localeReducer(state, toggleLanguage());
    expect(state.language).toBe('es');
    expect(localStorage.getItem('productpay_language_v1')).toBe('es');
  });
});
