import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { ClientLayoutShell } from '@/layout/components/client-layout-shell';
import { AppProviders } from '@/shared/providers/app-providers';

export const metadata: Metadata = {
  title: 'Aepsy FE Take-home',
  description: 'Monorepo scaffold for Aepsy React FE take-home assignment.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <AppProviders>
            <ClientLayoutShell year={currentYear}>
              {children}
            </ClientLayoutShell>
          </AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
