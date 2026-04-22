import type { PaletteColor, SimplePaletteColorOptions } from '@mui/material/styles';
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    recording: PaletteColor;
  }

  interface PaletteOptions {
    recording?: SimplePaletteColorOptions;
  }
}

export {};
