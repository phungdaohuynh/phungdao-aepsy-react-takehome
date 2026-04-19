'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { useTranslation } from '@workspace/localization';
import { Alert, Box, Container, Stack, Typography, UIStepProgress } from '@workspace/ui';

import { ASSIGNMENT_STEPS } from '@/shared/constants/steps';
import { StepRecording } from '@/features/recording/components/step-recording';
import { useAppStore } from '@/shared/state/store';
import { IntakeSummaryBar } from '@/layout/components/intake-summary-bar';
import { NetworkStatusBanner } from '@/layout/components/network-status-banner';
import { ResumeDraftBanner } from '@/layout/components/resume-draft-banner';

const AnalyticsDevDashboardLazy =
  process.env.NODE_ENV !== 'production'
    ? dynamic(
        () =>
          import('@/layout/components/analytics-dev-dashboard').then((module) => ({
            default: module.AnalyticsDevDashboard,
          })),
        { ssr: false },
      )
    : null;

const StepTopicsLazy = dynamic(
  () =>
    import('@/features/topics/components/step-topics').then((module) => ({
      default: module.StepTopics,
    })),
);
const StepPsychologistsLazy = dynamic(
  () =>
    import('@/features/psychologists/components/step-psychologists').then((module) => ({
      default: module.StepPsychologists,
    })),
);

export function StepShell() {
  const { t } = useTranslation();
  const step = useAppStore((state) => state.step);
  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);
  const selectedTopicsCount = useAppStore((state) => state.selectedTopics.length);
  const setStep = useAppStore((state) => state.setStep);
  const hasAudio = Boolean(audioDataUrl || audioStorageKey);
  const resolvedStep = useMemo(() => {
    if (step === 'topics' && !hasAudio) {
      return 'record';
    }

    if (step === 'psychologists' && selectedTopicsCount === 0) {
      return hasAudio ? 'topics' : 'record';
    }

    return step;
  }, [hasAudio, selectedTopicsCount, step]);

  const activeStep = ASSIGNMENT_STEPS.findIndex((item) => item.key === resolvedStep);
  const completedMap = useMemo(
    () => ({
      record: hasAudio,
      topics: selectedTopicsCount > 0,
    }),
    [hasAudio, selectedTopicsCount],
  );

  useEffect(() => {
    if (resolvedStep !== step) {
      setStep(resolvedStep);
    }
  }, [resolvedStep, setStep, step]);

  return (
    <Container maxWidth="md" sx={{ pt: 2, pb: { xs: 3, md: 4 } }}>
      <Stack spacing={2} data-testid={`step-shell-${resolvedStep}`}>
        <Typography
          variant="body2"
          component="h1"
          sx={{ fontWeight: 600, color: 'text.secondary' }}
        >
          {t('heroTitle')}
        </Typography>

        <Box sx={{ minHeight: 56 }}>
          <NetworkStatusBanner />
          <ResumeDraftBanner />
        </Box>
        <IntakeSummaryBar />

        <UIStepProgress
          steps={ASSIGNMENT_STEPS.map((item) => ({
            key: item.key,
            label: t(`steps.${item.key}`),
            completed: completedMap[item.key as 'record' | 'topics'],
          }))}
          activeStep={activeStep}
        />

        {resolvedStep === 'psychologists' && selectedTopicsCount === 0 ? (
          <Alert severity="warning">{t('errors.requireTopicBeforeSearch')}</Alert>
        ) : null}

        {resolvedStep === 'record' ? <StepRecording /> : null}

        {resolvedStep === 'topics' ? <StepTopicsLazy /> : null}

        {resolvedStep === 'psychologists' ? <StepPsychologistsLazy /> : null}

        {AnalyticsDevDashboardLazy ? <AnalyticsDevDashboardLazy /> : null}
      </Stack>
    </Container>
  );
}
