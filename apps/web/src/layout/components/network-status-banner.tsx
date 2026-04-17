'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from '@workspace/localization';
import { Alert } from '@workspace/ui';

export function NetworkStatusBanner() {
  const { t } = useTranslation();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <Alert severity="warning" data-testid="offline-banner">
      {t('network.offline')}
    </Alert>
  );
}
