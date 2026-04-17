'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useTranslation } from '@workspace/localization';
import { Alert, Container, Stack, Typography, UIStepProgress, UILoadingState } from '@workspace/ui';

import { ASSIGNMENT_STEPS } from '@/shared/constants/steps';
import { useAppStore } from '@/shared/state/store';
import { AnalyticsDevDashboard } from './analytics-dev-dashboard';
import { NetworkStatusBanner } from './network-status-banner';
import { ResumeDraftBanner } from './resume-draft-banner';

const StepRecordingLazy = dynamic(
  () => import('@/features/recording/components/step-recording').then((module) => ({ default: module.StepRecording })),
  { loading: () => <UILoadingState /> }
);
const StepTopicsLazy = dynamic(
  () => import('@/features/topics/components/step-topics').then((module) => ({ default: module.StepTopics })),
  { loading: () => <UILoadingState /> }
);
const StepPsychologistsLazy = dynamic(
  () => import('@/features/psychologists/components/step-psychologists').then((module) => ({ default: module.StepPsychologists })),
  { loading: () => <UILoadingState /> }
);

export function StepShell() {
  const { t } = useTranslation();
  const isClientReady = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const step = useAppStore((state) => state.step);
  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const selectedTopicsCount = useAppStore((state) => state.selectedTopics.length);
  const setStep = useAppStore((state) => state.setStep);

  const activeStep = ASSIGNMENT_STEPS.findIndex((item) => item.key === step);
  const completedMap = useMemo(
    () => ({
      record: Boolean(audioDataUrl),
      topics: selectedTopicsCount > 0
    }),
    [audioDataUrl, selectedTopicsCount]
  );

  useEffect(() => {
    if (step === 'topics' && !audioDataUrl) {
      setStep('record');
      return;
    }

    if (step === 'psychologists' && selectedTopicsCount === 0) {
      setStep(audioDataUrl ? 'topics' : 'record');
    }
  }, [audioDataUrl, selectedTopicsCount, setStep, step]);

  if (!isClientReady) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
        <UILoadingState />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3} data-testid={`step-shell-${step}`}>
        <Typography variant="h4" component="h1">
          {t('heroTitle')}
        </Typography>

        <NetworkStatusBanner />
        <ResumeDraftBanner />

        <UIStepProgress
          steps={ASSIGNMENT_STEPS.map((item) => ({
            key: item.key,
            label: t(`steps.${item.key}`),
            completed: completedMap[item.key as 'record' | 'topics']
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
