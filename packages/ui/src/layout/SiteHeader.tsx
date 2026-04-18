'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type UISiteHeaderProps = {
  title: string;
  rightSlot?: ReactNode;
};

export function UISiteHeader({ title, rightSlot }: UISiteHeaderProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(252, 252, 253, 0.85)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 64, gap: 2 }}>
          <Typography variant="h6" component="p" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Box sx={{ marginLeft: 'auto' }}>{rightSlot}</Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export type { UISiteHeaderProps };
