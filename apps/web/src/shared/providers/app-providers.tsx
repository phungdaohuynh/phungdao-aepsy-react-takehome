'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { setupI18n } from '@workspace/localization';
import { AppThemeProvider, UIToastProvider } from '@workspace/ui';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { createQueryClient } from './query-client';

setupI18n('en');

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <UIToastProvider>{children}</UIToastProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
