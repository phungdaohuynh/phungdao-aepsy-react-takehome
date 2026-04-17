'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

type UIEmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function UIEmptyState({ title, description, action }: UIEmptyStateProps) {
  return (
    <Box
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        textAlign: 'center',
        px: 3,
        py: 5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        alignItems: 'center'
      }}
    >
      <Typography variant="h6">{title}</Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
      {action}
    </Box>
  );
}

export type { UIEmptyStateProps };
