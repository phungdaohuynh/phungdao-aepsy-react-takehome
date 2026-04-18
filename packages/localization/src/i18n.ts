import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

export const supportedLanguages = ['en', 'de-CH'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export function setupI18n(defaultLanguage: SupportedLanguage = 'en') {
  if (!i18n.isInitialized) {
    void i18n
      .use(HttpBackend)
      .use(initReactI18next)
      .init({
        lng: defaultLanguage,
        fallbackLng: 'en',
        supportedLngs: [...supportedLanguages],
        ns: ['common'],
        defaultNS: 'common',
        backend: {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
  }

  return i18n;
}

export { i18n };
