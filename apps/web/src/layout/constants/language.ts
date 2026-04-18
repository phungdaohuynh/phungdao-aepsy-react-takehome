import type { SupportedLanguage } from '@workspace/localization';

export const LANGUAGE_FLAGS: Record<SupportedLanguage, { src: string; alt: string }> = {
  en: { src: '/flags/en.svg', alt: 'English' },
  'de-CH': { src: '/flags/de-ch.svg', alt: 'Deutsch (Schweiz)' }
};
