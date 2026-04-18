'use client';

import { i18n, supportedLanguages, type SupportedLanguage } from '@workspace/localization';
import { Box, IconButton, Menu, MenuItem } from '@workspace/ui';
import { useState } from 'react';

import { LANGUAGE_FLAGS } from '@/layout/constants/language';

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
        sx={{ borderRadius: 2, p: 0.5 }}
      >
        <Box
          component="img"
          src={LANGUAGE_FLAGS[current].src}
          alt={LANGUAGE_FLAGS[current].alt}
          sx={{
            width: 24,
            height: 18,
            display: 'block',
            objectFit: 'cover',
            borderRadius: 0.5,
          }}
        />
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
            <Box
              component="img"
              src={LANGUAGE_FLAGS[language].src}
              alt={LANGUAGE_FLAGS[language].alt}
              sx={{
                width: 24,
                height: 18,
                display: 'block',
                objectFit: 'cover',
                borderRadius: 0.5,
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
