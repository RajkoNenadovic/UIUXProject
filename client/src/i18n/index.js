import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import es from './locales/es/translation.json';
import hr from './locales/hr/translation.json';

const supportedLocales = ['en', 'es', 'hr'];
const storedLocale = window.localStorage.getItem('plain-language-locale');
const initialLocale = supportedLocales.includes(storedLocale) ? storedLocale : 'en';

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      hr: { translation: hr }
    },
    lng: initialLocale,
    fallbackLng: 'en',
    supportedLngs: supportedLocales,
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false }
  });

export { supportedLocales };
export default i18n;
