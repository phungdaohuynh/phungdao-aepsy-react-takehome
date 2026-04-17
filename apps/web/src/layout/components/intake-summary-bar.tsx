'use client';

import { useTranslation } from '@workspace/localization';
import { Box, Chip, Stack, UIButton } from '@workspace/ui';

import { useAppStore } from '@/shared/state/store';

export function IntakeSummaryBar() {
  const { t } = useTranslation();
  const step = useAppStore((state) => state.step);
  const setStep = useAppStore((state) => state.setStep);
  const selectedTopicsCount = useAppStore((state) => state.selectedTopics.length);
  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);

  const hasAudio = Boolean(audioDataUrl || audioStorageKey);

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 8,
        zIndex: 20,
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} useFlexGap sx={{ alignItems: { md: 'center' } }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip size="small" color={hasAudio ? 'success' : 'default'} label={hasAudio ? t('summary.audioReady') : t('summary.audioMissing')} />
          <Chip size="small" color={selectedTopicsCount > 0 ? 'success' : 'default'} label={t('summary.topicsSelected', { count: selectedTopicsCount })} />
          <Chip size="small" color="secondary" label={t('summary.currentStep', { step: t(`steps.${step}`) })} />
        </Stack>

        <Stack direction="row" spacing={1} useFlexGap>
          <UIButton size="small" variant={step === 'record' ? 'contained' : 'outlined'} onClick={() => setStep('record')}>
            {t('steps.record')}
          </UIButton>
          <UIButton
            size="small"
            variant={step === 'topics' ? 'contained' : 'outlined'}
            disabled={!hasAudio}
            onClick={() => setStep('topics')}
          >
            {t('steps.topics')}
          </UIButton>
          <UIButton
            size="small"
            variant={step === 'psychologists' ? 'contained' : 'outlined'}
            disabled={selectedTopicsCount === 0}
            onClick={() => setStep('psychologists')}
          >
            {t('steps.psychologists')}
          </UIButton>
        </Stack>
      </Stack>
    </Box>
  );
}
