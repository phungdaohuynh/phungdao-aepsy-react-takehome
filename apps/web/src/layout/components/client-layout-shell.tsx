'use client';

import { i18n } from '@workspace/localization';
import { useTranslation } from '@workspace/localization';
import { useEffect, type PropsWithChildren } from 'react';
import { UIAppShell, UISiteFooter, UISiteHeader } from '@workspace/ui';

import { LanguageSwitcher } from './language-switcher';

type ClientLayoutShellProps = PropsWithChildren<{
  year: number;
}>;

export function ClientLayoutShell({ year, children }: ClientLayoutShellProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const onLanguageChanged = (nextLanguage: string) => {
      document.documentElement.lang = nextLanguage;
    };

    onLanguageChanged(i18n.language || 'en');
    i18n.on('languageChanged', onLanguageChanged);

    return () => {
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  const title = t('appTitle');
  const footerLabel = t('footer', { year });

  return (
    <UIAppShell
      header={<UISiteHeader title={title} rightSlot={<LanguageSwitcher />} />}
      footer={<UISiteFooter text={footerLabel} />}
    >
      {children}
    </UIAppShell>
  );
}
