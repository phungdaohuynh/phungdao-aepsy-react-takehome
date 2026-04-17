'use client';

import { i18n, supportedLanguages, type SupportedLanguage } from '@workspace/localization';
import { useTranslation } from '@workspace/localization';
import { FormControl, InputLabel, MenuItem, Select } from '@workspace/ui';

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  'de-CH': 'Swiss German'
};

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const current = (i18n.language || 'en') as SupportedLanguage;

  return (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel id="language-select-label">{t('language.label')}</InputLabel>
      <Select
        labelId="language-select-label"
        label={t('language.label')}
        value={current}
        onChange={(event) => {
          const nextLanguage = event.target.value as SupportedLanguage;
          void i18n.changeLanguage(nextLanguage);
        }}
      >
        {supportedLanguages.map((language) => (
          <MenuItem key={language} value={language}>
            {t(`language.options.${language}`, { defaultValue: LANGUAGE_LABELS[language] })}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
