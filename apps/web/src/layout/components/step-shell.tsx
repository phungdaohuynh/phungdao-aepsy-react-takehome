'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from '@workspace/localization';
import { Alert, Container, Stack, Typography, UIStepProgress, UILoadingState } from '@workspace/ui';

import { ASSIGNMENT_STEPS } from '@/shared/constants/steps';
import { useAppStore } from '@/shared/state/store';
import { AnalyticsDevDashboard } from '@/layout/components/analytics-dev-dashboard';
import { IntakeSummaryBar } from '@/layout/components/intake-summary-bar';
import { NetworkStatusBanner } from '@/layout/components/network-status-banner';
import { ResumeDraftBanner } from '@/layout/components/resume-draft-banner';

const StepRecordingLazy = dynamic(
  () =>
    import('@/features/recording/components/step-recording').then((module) => ({
      default: module.StepRecording,
    })),
  { loading: () => <UILoadingState /> },
);
const StepTopicsLazy = dynamic(
  () =>
    import('@/features/topics/components/step-topics').then((module) => ({
      default: module.StepTopics,
    })),
  { loading: () => <UILoadingState /> },
);
const StepPsychologistsLazy = dynamic(
  () =>
    import('@/features/psychologists/components/step-psychologists').then((module) => ({
      default: module.StepPsychologists,
    })),
  { loading: () => <UILoadingState /> },
);

export function StepShell() {
  const { t } = useTranslation();
  const isClientReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const step = useAppStore((state) => state.step);
  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);
  const selectedTopicsCount = useAppStore((state) => state.selectedTopics.length);
  const setStep = useAppStore((state) => state.setStep);
  const hasAudio = Boolean(audioDataUrl || audioStorageKey);

  const activeStep = ASSIGNMENT_STEPS.findIndex((item) => item.key === step);
  const completedMap = useMemo(
    () => ({
      record: hasAudio,
      topics: selectedTopicsCount > 0,
    }),
    [hasAudio, selectedTopicsCount],
  );

  useEffect(() => {
    if (step === 'topics' && !hasAudio) {
      setStep('record');
      return;
    }

    if (step === 'psychologists' && selectedTopicsCount === 0) {
      setStep(hasAudio ? 'topics' : 'record');
    }
  }, [hasAudio, selectedTopicsCount, setStep, step]);

  if (!isClientReady) {
    return (
      <Container maxWidth="md" sx={{ pt: 2, pb: { xs: 3, md: 4 } }}>
        <UILoadingState />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: { xs: 3, md: 4 } }}>
      <Stack spacing={2} data-testid={`step-shell-${step}`}>
        <Typography
          variant="body2"
          component="h1"
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          {t('heroTitle')}
        </Typography>

        <NetworkStatusBanner />
        <ResumeDraftBanner />
        <IntakeSummaryBar />

        <UIStepProgress
          steps={ASSIGNMENT_STEPS.map((item) => ({
            key: item.key,
            label: t(`steps.${item.key}`),
            completed: completedMap[item.key as 'record' | 'topics'],
          }))}
          activeStep={activeStep}
        />

        {step === 'psychologists' && selectedTopicsCount === 0 ? (
          <Alert severity="warning">{t('errors.requireTopicBeforeSearch')}</Alert>
        ) : null}

        {step === 'record' ? <StepRecordingLazy /> : null}

        {step === 'topics' ? <StepTopicsLazy /> : null}

        {step === 'psychologists' ? <StepPsychologistsLazy /> : null}

        {process.env.NODE_ENV !== 'production' ? <AnalyticsDevDashboard /> : null}
      </Stack>
    </Container>
  );
}
