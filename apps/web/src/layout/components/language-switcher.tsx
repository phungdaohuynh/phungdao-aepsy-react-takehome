'use client';

import { i18n, supportedLanguages, type SupportedLanguage } from '@workspace/localization';
import { Box, IconButton, Menu, MenuItem } from '@workspace/ui';
import { useState } from 'react';

const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  'de-CH': '🇨🇭'
};

export function LanguageSwitcher() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const current = (i18n.language || 'en') as SupportedLanguage;
  const isOpen = Boolean(anchorEl);

  return (
    <>
      <IconButton
        aria-label="Change language"
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Box component="span" sx={{ fontSize: 22, lineHeight: 1 }}>
          {LANGUAGE_FLAGS[current]}
        </Box>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={() => {
          setAnchorEl(null);
        }}
      >
        {supportedLanguages.map((language) => (
          <MenuItem
            key={language}
            onClick={() => {
              void i18n.changeLanguage(language);
              setAnchorEl(null);
            }}
            selected={language === current}
            sx={{ minWidth: 56, justifyContent: 'center' }}
          >
            <Box component="span" sx={{ fontSize: 22, lineHeight: 1 }}>
              {LANGUAGE_FLAGS[language]}
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
