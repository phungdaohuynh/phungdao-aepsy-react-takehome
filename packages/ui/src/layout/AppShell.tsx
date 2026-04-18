'use client';

import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

type UIAppShellProps = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function UIAppShell({ header, footer, children }: UIAppShellProps) {
  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        overflow: 'hidden',
        background:
          'radial-gradient(1200px 400px at 10% 0%, rgba(47, 158, 122, 0.12), transparent), radial-gradient(900px 420px at 90% 0%, rgba(123, 91, 183, 0.12), transparent)'
      }}
    >
      {header}
      <Box sx={{ minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <Box component="main">{children}</Box>
        {footer}
      </Box>
    </Box>
  );
}

export type { UIAppShellProps };
