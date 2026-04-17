'use client';

import MenuItem from '@mui/material/MenuItem';
import TextField, { type TextFieldProps } from '@mui/material/TextField';

export type UISelectOption = {
  label: string;
  value: string;
};

export type UISelectProps = Omit<TextFieldProps, 'select'> & {
  options: UISelectOption[];
};

export function UISelect({ options, ...props }: UISelectProps) {
  return (
    <TextField fullWidth select size="medium" variant="outlined" {...props}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
