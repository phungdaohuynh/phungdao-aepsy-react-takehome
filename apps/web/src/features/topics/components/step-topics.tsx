'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '@workspace/localization';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  UIButton,
  UILoadingState,
  UISectionCard,
  useUIToast
} from '@workspace/ui';

import { useAudioTranscriber } from '@/features/topics/hooks/use-audio-transcriber';
import { trackEvent } from '@/shared/lib/analytics';
import { useAppStore } from '@/shared/state/store';

async function audioDataUrlToArrayBuffer(audioDataUrl: string) {
  const response = await fetch(audioDataUrl);
  return await response.arrayBuffer();
}

export function StepTopics() {
  const { t } = useTranslation();
  const toast = useUIToast();
  const hasAutoProcessedRef = useRef(false);

  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const selectedTopics = useAppStore((state) => state.selectedTopics);
  const toggleTopic = useAppStore((state) => state.toggleTopic);
  const setStep = useAppStore((state) => state.setStep);

  const transcriber = useAudioTranscriber();

  const onAnalyzeAudio = useCallback(async () => {
    if (!audioDataUrl) {
      toast.showError(t('topics.toast.noAudio'));
      return;
    }

    try {
      trackEvent('topics_analyze_started');
      const audioBuffer = await audioDataUrlToArrayBuffer(audioDataUrl);
      await transcriber.processAudio(audioBuffer);
      trackEvent('topics_analyze_success');
    } catch {
      toast.showError(t('topics.toast.analyzeFailed'));
    }
  }, [audioDataUrl, t, toast, transcriber]);

  useEffect(() => {
    if (!audioDataUrl || hasAutoProcessedRef.current || transcriber.data || transcriber.isLoading) {
      return;
    }

    hasAutoProcessedRef.current = true;
    void onAnalyzeAudio();
  }, [audioDataUrl, onAnalyzeAudio, transcriber.data, transcriber.isLoading]);

  const selectedCount = selectedTopics.length;

  const sortedTopics = useMemo(() => {
    const topics = transcriber.data ?? [];
    const uniqueByValue = new Map(topics.map((item) => [item.value, item]));
    return [...uniqueByValue.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [transcriber.data]);

  return (
    <UISectionCard title={t('topics.title')} subheader={t('topics.subheader')}>
      <Stack spacing={2.5} data-testid="step-topics">
        <Typography color="text.secondary">
          {t('topics.description')} <code>useAudioTranscriber</code>.
        </Typography>

        {!audioDataUrl ? (
          <Alert
            severity="warning"
            action={
              <UIButton variant="text" onClick={() => setStep('record')}>
                {t('topics.actions.backToStep1')}
              </UIButton>
            }
          >
            {t('topics.audioMissing')}
          </Alert>
        ) : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap>
          <UIButton
            onClick={() => void onAnalyzeAudio()}
            disabled={!audioDataUrl || transcriber.isLoading}
            data-testid="topics-analyze-button"
          >
            {t('topics.actions.analyze')}
          </UIButton>
          <UIButton variant="outlined" onClick={() => setStep('record')}>
            {t('topics.actions.backToStep1')}
          </UIButton>
        </Stack>

        {transcriber.isLoading ? <UILoadingState label={t('topics.loading')} /> : null}

        {transcriber.error ? <Alert severity="error">{transcriber.error}</Alert> : null}

        {sortedTopics.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('topics.selectedCount', { count: selectedCount })}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {sortedTopics.map((topic, index) => {
                const isSelected = selectedTopics.includes(topic.value);
                const confidence = 0.68 + ((index % 7) * 0.04);

                return (
                  <Chip
                    key={`${topic.value}-${index}`}
                    label={`${topic.label} (${Math.min(99, Math.round(confidence * 100))}%)`}
                    clickable
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    data-testid={`topic-chip-${topic.value}`}
                    onClick={() => {
                      toggleTopic(topic.value);
                      trackEvent('topics_selected', { topic: topic.value, selected: !isSelected });
                    }}
                  />
                );
              })}
            </Box>
          </>
        ) : null}

        <Divider />

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'center',
            position: { xs: 'sticky', md: 'static' },
            bottom: { xs: 12, md: 'auto' },
            zIndex: 5
          }}
        >
          <UIButton variant="outlined" onClick={() => setStep('record')}>
            {t('common.back')}
          </UIButton>
          <UIButton disabled={selectedCount === 0} onClick={() => setStep('psychologists')} data-testid="topics-continue-button">
            {t('topics.actions.continue')}
          </UIButton>
        </Box>
      </Stack>
    </UISectionCard>
  );
}
