'use client';

import { CssBaseline, ThemeProvider } from '@mui/material';
import type { PropsWithChildren } from 'react';

import { appTheme } from './theme';

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
