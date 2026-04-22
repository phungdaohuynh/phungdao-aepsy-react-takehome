'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { useTranslation } from '@workspace/localization';
import { Alert, Container, Stack, Typography, UIStepProgress } from '@workspace/ui';

import { ASSIGNMENT_STEPS } from '@/shared/constants/steps';
import { StepRecording } from '@/features/recording/components/step-recording';
import { useAppStore } from '@/shared/state/store';
import { NetworkStatusBanner } from '@/layout/components/network-status-banner';
import { ResumeDraftBanner } from '@/layout/components/resume-draft-banner';

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
          variant="h6"
          component="h1"
          sx={{ fontSize: { xs: '1.125rem', md: '1.25rem' }, fontWeight: 600, color: 'text.secondary' }}
        >
          {t('heroTitle')}
        </Typography>

        <Stack spacing={1}>
          <NetworkStatusBanner />
          <ResumeDraftBanner />
        </Stack>

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

      </Stack>
    </Container>
  );
}
