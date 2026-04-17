'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form';

import type { UISelectOption } from '../components/Select';

type UIFormSelectFieldProps<TFieldValues extends FieldValues> = Omit<
  TextFieldProps,
  'name' | 'defaultValue' | 'select'
> & {
  name: FieldPath<TFieldValues>;
  options: UISelectOption[];
  methods: UseFormReturn<TFieldValues>;
};

export function UIFormSelectField<TFieldValues extends FieldValues>({
  name,
  options,
  methods,
  helperText,
  ...props
}: UIFormSelectFieldProps<TFieldValues>) {
  return (
    <Controller
      control={methods.control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          {...props}
          fullWidth
          select
          size="medium"
          variant="outlined"
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
