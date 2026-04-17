'use client';

import Typography from '@mui/material/Typography';

import { UIButton } from './Button';
import { UIModal, type UIModalProps } from './Modal';

type UIConfirmDialogProps = Omit<UIModalProps, 'actions'> & {
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLoading?: boolean;
};

export function UIConfirmDialog({
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
  confirmLoading = false,
  children,
  ...props
}: UIConfirmDialogProps) {
  return (
    <UIModal
      {...props}
      onClose={onCancel}
      actions={
        <>
          <UIButton variant="text" onClick={onCancel} disabled={confirmLoading}>
            {cancelLabel}
          </UIButton>
          <UIButton
            color={destructive ? 'error' : 'primary'}
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLabel}
          </UIButton>
        </>
      }
    >
      {description ? <Typography color="text.secondary">{description}</Typography> : null}
      {children}
    </UIModal>
  );
}

export type { UIConfirmDialogProps };
