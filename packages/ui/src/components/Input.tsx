'use client';

import TextField, { type TextFieldProps } from '@mui/material/TextField';

export type UIInputProps = TextFieldProps;

export function UIInput(props: UIInputProps) {
  return <TextField fullWidth size="medium" variant="outlined" {...props} />;
}
