'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import type { ReactNode } from 'react';

type UISectionCardProps = {
  title?: ReactNode;
  subheader?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export function UISectionCard({ title, subheader, action, children }: UISectionCardProps) {
  return (
    <Card variant="outlined">
      {title ? <CardHeader title={title} subheader={subheader} action={action} /> : null}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export type { UISectionCardProps };
