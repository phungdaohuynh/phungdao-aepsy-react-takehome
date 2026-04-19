import i18n from 'i18next';
import type { Resource } from 'i18next';
import type { InitOptions } from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

export const supportedLanguages = ['en', 'de-CH'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

type SetupI18nOptions = {
  resources?: Resource;
};

export function setupI18n(defaultLanguage: SupportedLanguage = 'en', options?: SetupI18nOptions) {
  if (!i18n.isInitialized) {
    const initOptions: InitOptions<{ loadPath: string }> = {
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
    };

    if (options?.resources) {
      initOptions.resources = options.resources;
    }

    i18n.use(HttpBackend).use(initReactI18next).init(initOptions);
  }

  return i18n;
}

export { i18n };
