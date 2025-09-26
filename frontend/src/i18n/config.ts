import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru/common.json';
import kk from './locales/kk/common.json';

export const resources = {
  ru: { translation: ru },
  kk: { translation: kk },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('cop-lang') ?? 'ru',
    fallbackLng: 'ru',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('cop-lang', lng);
});

export default i18n;
