'use client';

import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';

type UIFormTextFieldProps<TFieldValues extends FieldValues> = Omit<
  TextFieldProps,
  'name' | 'defaultValue'
> & {
  name: FieldPath<TFieldValues>;
  methods: UseFormReturn<TFieldValues>;
};

export function UIFormTextField<TFieldValues extends FieldValues>({
  name,
  methods,
  helperText,
  ...props
}: UIFormTextFieldProps<TFieldValues>) {
  return (
    <Controller
      control={methods.control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          fullWidth
          size="medium"
          variant="outlined"
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}
