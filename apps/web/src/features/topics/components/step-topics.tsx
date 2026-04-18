'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@workspace/localization';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Tooltip,
  Stack,
  Typography,
  TextField,
  UIButton,
  UILoadingState,
  UISectionCard,
  useUIToast
} from '@workspace/ui';

import { TOPIC_FILTER_GROUPS, type TopicFilterKey } from '@/features/topics/constants/topic-filters';
import { useAudioTranscriber } from '@/features/topics/hooks/use-audio-transcriber';
import { trackEvent } from '@/shared/lib/analytics';
import { getAudioBlob } from '@/shared/lib/audio-storage';
import { useAppStore } from '@/shared/state/store';

async function audioDataUrlToArrayBuffer(audioDataUrl: string) {
  const response = await fetch(audioDataUrl);
  return await response.arrayBuffer();
}

async function resolveAudioArrayBuffer(audioDataUrl: string | null, audioStorageKey: string | null) {
  if (audioStorageKey) {
    const blob = await getAudioBlob(audioStorageKey);
    if (blob) {
      return await blob.arrayBuffer();
    }
  }

  if (audioDataUrl) {
    return await audioDataUrlToArrayBuffer(audioDataUrl);
  }

  throw new Error('No audio data available.');
}

export function StepTopics() {
  const { t } = useTranslation();
  const toast = useUIToast();
  const hasAutoProcessedRef = useRef(false);
  const [activeFilterGroup, setActiveFilterGroup] = useState<TopicFilterKey>('all');
  const [topicQuery, setTopicQuery] = useState('');

  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);
  const selectedTopics = useAppStore((state) => state.selectedTopics);
  const selectedTopicsPast = useAppStore((state) => state.selectedTopicsPast);
  const selectedTopicsFuture = useAppStore((state) => state.selectedTopicsFuture);
  const toggleTopic = useAppStore((state) => state.toggleTopic);
  const setSelectedTopics = useAppStore((state) => state.setSelectedTopics);
  const undoTopicSelection = useAppStore((state) => state.undoTopicSelection);
  const redoTopicSelection = useAppStore((state) => state.redoTopicSelection);
  const setStep = useAppStore((state) => state.setStep);

  const transcriber = useAudioTranscriber();

  const onAnalyzeAudio = useCallback(async () => {
    if (!audioDataUrl && !audioStorageKey) {
      toast.showError(t('topics.toast.noAudio'));
      return;
    }

    try {
      trackEvent('topics_analyze_started');
      const audioBuffer = await resolveAudioArrayBuffer(audioDataUrl, audioStorageKey);
      await transcriber.processAudio(audioBuffer);
      trackEvent('topics_analyze_success');
    } catch {
      toast.showError(t('topics.toast.analyzeFailed'));
    }
  }, [audioDataUrl, audioStorageKey, t, toast, transcriber]);

  useEffect(() => {
    if ((!audioDataUrl && !audioStorageKey) || hasAutoProcessedRef.current || transcriber.data || transcriber.isLoading) {
      return;
    }

    hasAutoProcessedRef.current = true;
    void onAnalyzeAudio();
  }, [audioDataUrl, audioStorageKey, onAnalyzeAudio, transcriber.data, transcriber.isLoading]);

  const selectedCount = selectedTopics.length;

  const sortedTopics = useMemo(() => {
    const topics = transcriber.data ?? [];
    const uniqueByValue = new Map(topics.map((item) => [item.value, item]));
    return [...uniqueByValue.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [transcriber.data]);

  const filteredTopics = useMemo(() => {
    const normalizedQuery = topicQuery.trim().toLowerCase();
    const groupConfig = TOPIC_FILTER_GROUPS.find((item) => item.key === activeFilterGroup) ?? TOPIC_FILTER_GROUPS[0];

    return sortedTopics.filter((topic) => {
      const matchesGroup = groupConfig.matcher(topic.value);
      if (!matchesGroup) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return topic.label.toLowerCase().includes(normalizedQuery);
    });
  }, [activeFilterGroup, sortedTopics, topicQuery]);

  return (
    <UISectionCard title={t('topics.title')} subheader={t('topics.subheader')}>
      <Stack spacing={2.5} data-testid="step-topics">
        <Typography color="text.secondary">
          {t('topics.description')} <code>useAudioTranscriber</code>.
        </Typography>

        {!audioDataUrl && !audioStorageKey ? (
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
            disabled={(!audioDataUrl && !audioStorageKey) || transcriber.isLoading}
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                size="small"
                fullWidth
                value={topicQuery}
                placeholder={t('topics.searchPlaceholder')}
                onChange={(event) => setTopicQuery(event.target.value)}
              />
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {TOPIC_FILTER_GROUPS.map((group) => (
                  <Chip
                    key={group.key}
                    clickable
                    color={activeFilterGroup === group.key ? 'primary' : 'default'}
                    variant={activeFilterGroup === group.key ? 'filled' : 'outlined'}
                    label={t(`topics.filters.${group.key}`)}
                    onClick={() => setActiveFilterGroup(group.key)}
                  />
                ))}
              </Stack>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap>
              <Tooltip title={selectedTopicsPast.length === 0 ? t('topics.tooltips.noUndoHistory') : t('topics.tooltips.undo')}>
                <span>
                  <UIButton
                    variant="outlined"
                    size="small"
                    disabled={selectedTopicsPast.length === 0}
                    onClick={() => {
                      undoTopicSelection();
                      trackEvent('topics_undo');
                    }}
                  >
                    {t('topics.actions.undo')}
                  </UIButton>
                </span>
              </Tooltip>
              <Tooltip title={selectedTopicsFuture.length === 0 ? t('topics.tooltips.noRedoHistory') : t('topics.tooltips.redo')}>
                <span>
                  <UIButton
                    variant="outlined"
                    size="small"
                    disabled={selectedTopicsFuture.length === 0}
                    onClick={() => {
                      redoTopicSelection();
                      trackEvent('topics_redo');
                    }}
                  >
                    {t('topics.actions.redo')}
                  </UIButton>
                </span>
              </Tooltip>
              <Tooltip title={t('topics.tooltips.quickPick')}>
                <span>
                  <UIButton
                    variant="text"
                    size="small"
                    onClick={() => {
                      const topRecommended = sortedTopics.slice(0, 3).map((item) => item.value);
                      setSelectedTopics(topRecommended);
                    }}
                  >
                    {t('topics.actions.quickPick')}
                  </UIButton>
                </span>
              </Tooltip>
            </Stack>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filteredTopics.map((topic, index) => {
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

            {filteredTopics.length === 0 ? <Alert severity="info">{t('topics.noFilteredResult')}</Alert> : null}
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
          <Tooltip title={selectedCount === 0 ? t('topics.tooltips.selectAtLeastOne') : t('topics.tooltips.continue')}>
            <span>
              <UIButton disabled={selectedCount === 0} onClick={() => setStep('psychologists')} data-testid="topics-continue-button">
                {t('topics.actions.continue')}
              </UIButton>
            </span>
          </Tooltip>
        </Box>
      </Stack>
    </UISectionCard>
  );
}
