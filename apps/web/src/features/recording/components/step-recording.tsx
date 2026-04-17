'use client';

import { useRef, type ChangeEvent } from 'react';
import { useTranslation } from '@workspace/localization';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  UIButton,
  UISectionCard,
  useUIToast
} from '@workspace/ui';

import { useAudioRecorderMachine } from '@/features/recording/hooks/use-audio-recorder-machine';
import { trackEvent } from '@/shared/lib/analytics';
import { useAppStore } from '@/shared/state/store';

function statusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case 'recording':
      return t('recording.status.recording');
    case 'requesting_permission':
      return t('recording.status.requestingPermission');
    case 'stopped':
      return t('recording.status.audioReady');
    case 'unsupported':
      return t('recording.status.notSupported');
    case 'error':
      return t('recording.status.error');
    default:
      return t('recording.status.ready');
  }
}

function statusColor(status: string): 'default' | 'success' | 'error' | 'warning' {
  switch (status) {
    case 'recording':
      return 'warning';
    case 'stopped':
      return 'success';
    case 'unsupported':
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}

export function StepRecording() {
  const { t } = useTranslation();
  const toast = useUIToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioFileName = useAppStore((state) => state.audioFileName);
  const audioSourceType = useAppStore((state) => state.audioSourceType);
  const setAudioPayload = useAppStore((state) => state.setAudioPayload);
  const clearAudioPayload = useAppStore((state) => state.clearAudioPayload);
  const clearSelectedTopics = useAppStore((state) => state.clearSelectedTopics);
  const setStep = useAppStore((state) => state.setStep);
  const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

  const recorder = useAudioRecorderMachine({
    onAudioReady: ({ audioDataUrl: nextAudioDataUrl, audioFileName: nextAudioFileName, audioMimeType, sourceType }) => {
      clearSelectedTopics();
      setAudioPayload({
        audioDataUrl: nextAudioDataUrl,
        audioMimeType,
        audioFileName: nextAudioFileName,
        audioSourceType: sourceType
      });

      if (sourceType === 'uploaded') {
        toast.showSuccess(t('recording.toast.uploadedSuccess'));
        trackEvent('audio_uploaded', { mimeType: audioMimeType, sizeKb: Math.round(nextAudioDataUrl.length / 1024) });
      } else {
        toast.showSuccess(t('recording.toast.recordedSuccess'));
        trackEvent('record_stopped', { mimeType: audioMimeType });
      }
    },
    onError: (message) => {
      toast.showError(message);
    }
  });

  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isAudioByMime = file.type.startsWith('audio/');
    const isAudioByName = /\.(mp3|wav|m4a|webm|ogg|aac|flac)$/i.test(file.name);

    if (!isAudioByMime && !isAudioByName) {
      toast.showError(t('recording.toast.invalidAudio'));
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.showError(t('recording.toast.tooLargeFile'));
      return;
    }

    await recorder.handleAudioUpload(file);

    event.target.value = '';
  };

  const onReRecord = () => {
    recorder.resetMachine();
    clearAudioPayload();
    clearSelectedTopics();
    toast.showInfo(t('recording.toast.cleared'));
  };

  const onUseDemoAudio = () => {
    clearSelectedTopics();
    setAudioPayload({
      audioDataUrl: 'data:audio/webm;base64,ZmFrZS1hdWRpby1kYXRh',
      audioMimeType: 'audio/webm',
      audioFileName: 'demo-audio.webm',
      audioSourceType: 'uploaded'
    });
    toast.showInfo(t('recording.toast.demoLoaded'));
  };

  return (
    <UISectionCard
      title={t('recording.title')}
      subheader={t('recording.subheader')}
      action={<Chip label={statusLabel(recorder.state.status, t)} color={statusColor(recorder.state.status)} />}
    >
      <Stack spacing={2.5} data-testid="step-recording">
        <Typography color="text.secondary">
          {t('recording.description')}
        </Typography>

        {recorder.state.interrupted ? (
          <Alert severity="warning">{t('recording.interrupted')}</Alert>
        ) : null}

        {recorder.state.error ? <Alert severity="error">{recorder.state.error}</Alert> : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <UIButton
            onClick={() => {
              trackEvent('record_started');
              void recorder.startRecording();
            }}
            disabled={!recorder.canStart}
            data-testid="record-start-button"
          >
            {t('recording.actions.start')}
          </UIButton>
          <UIButton
            variant="outlined"
            onClick={recorder.stopRecording}
            disabled={recorder.state.status !== 'recording'}
            data-testid="record-stop-button"
          >
            {t('recording.actions.stop')}
          </UIButton>
          <UIButton
            variant="text"
            onClick={onReRecord}
            disabled={!audioDataUrl}
            data-testid="record-rerecord-button"
          >
            {t('recording.actions.rerecord')}
          </UIButton>
          <UIButton variant="outlined" onClick={onUploadClick} data-testid="record-upload-button">
            {t('recording.actions.upload')}
          </UIButton>
          {process.env.NODE_ENV !== 'production' ? (
            <UIButton
              variant="text"
              onClick={onUseDemoAudio}
              data-testid="record-use-demo-audio-button"
            >
              {t('recording.actions.demo')}
            </UIButton>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            data-testid="record-upload-input"
            onChange={(event) => {
              void onFileChange(event);
            }}
          />
        </Stack>

        {audioDataUrl ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('recording.sourcePrefix')} {audioSourceType} {audioFileName ? `• ${audioFileName}` : ''}
            </Typography>
            <audio controls src={audioDataUrl} style={{ width: '100%' }} data-testid="record-audio-player" />
          </Box>
        ) : (
          <Alert severity="info">{t('recording.noAudio')}</Alert>
        )}

        <Divider />

        <Box
          sx={{
            position: { xs: 'sticky', md: 'static' },
            bottom: { xs: 12, md: 'auto' },
            zIndex: 5
          }}
        >
          <UIButton
            disabled={!audioDataUrl}
            onClick={() => setStep('topics')}
            data-testid="record-continue-button"
          >
            {t('recording.actions.continue')}
          </UIButton>
        </Box>

        <Typography variant="caption" color="text.secondary" role="status" aria-live="polite">
          {t('recording.liveStatus')} {statusLabel(recorder.state.status, t)}.
        </Typography>
      </Stack>
    </UISectionCard>
  );
}
