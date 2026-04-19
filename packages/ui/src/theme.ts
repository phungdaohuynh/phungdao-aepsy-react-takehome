import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f6f56',
      light: '#2f9e7a',
      dark: '#15503e',
    },
    secondary: {
      main: '#7b5bb7',
      light: '#a086d1',
      dark: '#5b418f',
    },
    text: {
      primary: '#18181b',
      secondary: '#3f3f46',
    },
    background: {
      default: '#f4f6f8',
      paper: '#fcfcfd',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          color: '#15503e',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          color: '#18181b',
        },
        message: {
          color: '#18181b',
        },
        action: {
          '& .MuiButton-root': {
            color: '#18181b',
            fontWeight: 700,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});
