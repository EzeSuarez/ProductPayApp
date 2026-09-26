import { useAppDispatch, useAppSelector } from '../store';
import { setLanguage, toggleLanguage } from '../store/slices/localeSlice';
import { translations, Language, Translations } from './translations';

export const useTranslation = (): {
  t: Translations;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
} => {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.locale.language);
  const t = translations[language] || translations.es;

  return {
    t,
    language,
    setLanguage: (lang: Language) => dispatch(setLanguage(lang)),
    toggleLanguage: () => dispatch(toggleLanguage()),
  };
};
