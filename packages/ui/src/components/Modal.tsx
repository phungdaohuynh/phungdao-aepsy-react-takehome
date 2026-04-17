'use client';

import Dialog, { type DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import type { ReactNode } from 'react';

type UIModalProps = Omit<DialogProps, 'title'> & {
  title?: ReactNode;
  actions?: ReactNode;
};

export function UIModal({ title, actions, children, ...props }: UIModalProps) {
  return (
    <Dialog fullWidth maxWidth="sm" {...props}>
      {title ? <DialogTitle>{title}</DialogTitle> : null}
      <DialogContent dividers>{children}</DialogContent>
      {actions ? <DialogActions>{actions}</DialogActions> : null}
    </Dialog>
  );
}

export type { UIModalProps };
