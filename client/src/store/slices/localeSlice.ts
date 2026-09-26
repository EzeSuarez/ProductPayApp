import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language } from '../../i18n/translations';

export interface LocaleState {
  language: Language;
}

const STORAGE_KEY = 'productpay_language_v1';

const getInitialLanguage = (): Language => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'es'; // Spanish by default
};

const initialState: LocaleState = {
  language: getInitialLanguage(),
};

export const localeSlice = createSlice({
  name: 'locale',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      try {
        localStorage.setItem(STORAGE_KEY, action.payload);
      } catch {
        // Ignore storage errors
      }
    },
    toggleLanguage: (state) => {
      const nextLang: Language = state.language === 'es' ? 'en' : 'es';
      state.language = nextLang;
      try {
        localStorage.setItem(STORAGE_KEY, nextLang);
      } catch {
        // Ignore
      }
    },
  },
});

export const { setLanguage, toggleLanguage } = localeSlice.actions;
export default localeSlice.reducer;
