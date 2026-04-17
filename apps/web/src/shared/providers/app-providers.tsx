'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { setupI18n } from '@workspace/localization';
import { AppThemeProvider, UIToastProvider } from '@workspace/ui';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

import { getAudioBlob } from '@/shared/lib/audio-storage';
import { createQueryClient } from '@/shared/providers/query-client';
import { useAppStore } from '@/shared/state/store';

setupI18n('en');

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient());
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);
  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const setAudioDataUrl = useAppStore((state) => state.setAudioDataUrl);
  const hydratedPreviewRef = useRef<string | null>(null);
  const hydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (audioDataUrl || !audioStorageKey) {
      return;
    }

    let isMounted = true;

    void (async () => {
      const blob = await getAudioBlob(audioStorageKey);

      if (!isMounted || !blob) {
        return;
      }

      if (hydratedPreviewRef.current) {
        URL.revokeObjectURL(hydratedPreviewRef.current);
      }

      const previewUrl = URL.createObjectURL(blob);
      hydratedPreviewRef.current = previewUrl;
      hydratedKeyRef.current = audioStorageKey;
      setAudioDataUrl(previewUrl);
    })();

    return () => {
      isMounted = false;
    };
  }, [audioDataUrl, audioStorageKey, setAudioDataUrl]);

  useEffect(() => {
    if (hydratedKeyRef.current && audioStorageKey && hydratedKeyRef.current !== audioStorageKey && hydratedPreviewRef.current) {
      URL.revokeObjectURL(hydratedPreviewRef.current);
      hydratedPreviewRef.current = null;
      hydratedKeyRef.current = null;
    }

    if (!audioStorageKey && hydratedPreviewRef.current) {
      URL.revokeObjectURL(hydratedPreviewRef.current);
      hydratedPreviewRef.current = null;
      hydratedKeyRef.current = null;
    }
  }, [audioStorageKey]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <UIToastProvider>{children}</UIToastProvider>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
