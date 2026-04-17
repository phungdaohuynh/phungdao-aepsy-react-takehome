'use client';

import Button, { type ButtonProps } from '@mui/material/Button';

export type UIButtonProps = ButtonProps;

export function UIButton(props: UIButtonProps) {
  return <Button variant="contained" disableElevation {...props} />;
}
