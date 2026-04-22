'use client';

import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
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
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        overflow: 'hidden',
        background: (theme) =>
          `radial-gradient(1200px 400px at 10% 0%, ${alpha(theme.palette.primary.light, 0.12)}, transparent), radial-gradient(900px 420px at 90% 0%, ${alpha(theme.palette.secondary.light, 0.12)}, transparent)`,
      }}
    >
      {header}
      <Box sx={{ minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        <Box component="main">{children}</Box>
      </Box>
      {footer}
    </Box>
  );
}

export type { UIAppShellProps };
