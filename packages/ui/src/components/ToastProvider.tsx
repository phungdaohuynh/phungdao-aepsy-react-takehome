'use client';

import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type UIToastOptions = {
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
};

type UIToastContextValue = {
  showToast: (options: UIToastOptions) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
};

const UIToastContext = createContext<UIToastContextValue | null>(null);

export function UIToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<UIToastOptions | null>(null);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const showToast = useCallback((options: UIToastOptions) => {
    setToast(options);
  }, []);

  const value = useMemo<UIToastContextValue>(
    () => ({
      showToast,
      showSuccess: (message) => showToast({ message, severity: 'success' }),
      showError: (message) => showToast({ message, severity: 'error' }),
      showInfo: (message) => showToast({ message, severity: 'info' }),
      showWarning: (message) => showToast({ message, severity: 'warning' }),
    }),
    [showToast],
  );

  return (
    <UIToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={toast?.autoHideDuration ?? 3500}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeToast}
          severity={toast?.severity ?? 'info'}
          variant="filled"
          sx={{
            width: '100%',
            '&&': { color: 'common.white' },
            '&& .MuiAlert-message': { color: 'common.white' },
            '&& .MuiAlert-icon': { color: 'common.white' },
            '&& .MuiAlert-action .MuiButtonBase-root': { color: 'common.white' },
          }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </UIToastContext.Provider>
  );
}

export function useUIToast() {
  const context = useContext(UIToastContext);

  if (!context) {
    throw new Error('useUIToast must be used within UIToastProvider');
  }

  return context;
}
