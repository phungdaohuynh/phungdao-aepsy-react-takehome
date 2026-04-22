'use client';

import { useEffect, useRef } from 'react';
import { useTranslation } from '@workspace/localization';
import { useUIToast } from '@workspace/ui';

export function NetworkStatusBanner() {
  const { t } = useTranslation();
  const { showSuccess, showWarning } = useUIToast();
  const hasShownInitialStatusRef = useRef(false);
  const previousOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    const publishStatusToast = (isOnline: boolean) => {
      if (!isOnline) {
        showWarning(t('network.offline'));
        return;
      }

      showSuccess(t('network.online'));
    };

    const updateStatus = () => {
      const isOnline = navigator.onLine;

      if (!hasShownInitialStatusRef.current) {
        hasShownInitialStatusRef.current = true;
        previousOnlineRef.current = isOnline;

        if (!isOnline) {
          publishStatusToast(false);
        }

        return;
      }

      if (previousOnlineRef.current === isOnline) {
        return;
      }

      previousOnlineRef.current = isOnline;
      publishStatusToast(isOnline);
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [showSuccess, showWarning, t]);

  return null;
}
