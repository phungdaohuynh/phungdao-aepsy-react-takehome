'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@workspace/localization';
import { Alert, UIButton } from '@workspace/ui';

import { deleteAudioBlob } from '@/shared/lib/audio-storage';
import { useAppStore } from '@/shared/state/store';

function formatLastSaved(value: number | null) {
  if (!value) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: 'short',
  });

  return formatter.format(new Date(value));
}

export function ResumeDraftBanner() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const step = useAppStore((state) => state.step);
  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);
  const selectedTopicsCount = useAppStore((state) => state.selectedTopics.length);
  const lastUpdatedAt = useAppStore((state) => state.lastUpdatedAt);
  const reset = useAppStore((state) => state.reset);

  const shouldShow =
    hasHydrated &&
    (step !== 'record' || Boolean(audioDataUrl || audioStorageKey) || selectedTopicsCount > 0);

  const label = useMemo(() => formatLastSaved(lastUpdatedAt), [lastUpdatedAt]);

  if (!shouldShow || dismissed) {
    return null;
  }

  return (
    <Alert
      severity="info"
      data-testid="resume-draft-banner"
      action={
        <UIButton
          size="small"
          variant="text"
          onClick={() => {
            if (audioStorageKey) {
              void deleteAudioBlob(audioStorageKey);
            }

            if (audioDataUrl?.startsWith('blob:')) {
              URL.revokeObjectURL(audioDataUrl);
            }

            reset();
            setDismissed(true);
          }}
        >
          {t('resume.clearDraft')}
        </UIButton>
      }
      onClose={() => setDismissed(true)}
    >
      {label ? t('resume.restoredWithTime', { label }) : t('resume.restored')}
    </Alert>
  );
}
