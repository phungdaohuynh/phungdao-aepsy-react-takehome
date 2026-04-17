'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from '@workspace/localization';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Tooltip,
  Stack,
  Typography,
  Link,
  UIButton,
  UIConfirmDialog,
  UISectionCard,
  useUIToast
} from '@workspace/ui';

import { useAudioRecorderMachine } from '@/features/recording/hooks/use-audio-recorder-machine';
import { useLargeAudioUpload } from '@/features/recording/hooks/use-large-audio-upload';
import { trackEvent } from '@/shared/lib/analytics';
import { deleteAudioBlob, saveAudioBlob } from '@/shared/lib/audio-storage';
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
  const [hasConsent, setHasConsent] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);
  const audioFileName = useAppStore((state) => state.audioFileName);
  const audioSourceType = useAppStore((state) => state.audioSourceType);
  const setAudioPayload = useAppStore((state) => state.setAudioPayload);
  const clearAudioPayload = useAppStore((state) => state.clearAudioPayload);
  const clearSelectedTopics = useAppStore((state) => state.clearSelectedTopics);
  const setStep = useAppStore((state) => state.setStep);
  const SMALL_UPLOAD_MAX_BYTES = 30 * 1024 * 1024;
  const VERY_LARGE_UPLOAD_MAX_BYTES = 1024 * 1024 * 1024;
  const LARGE_UPLOAD_PREVIEW_BYTES = 8 * 1024 * 1024;
  const hasAudio = Boolean(audioDataUrl || audioStorageKey);
  const largeUpload = useLargeAudioUpload();
  const intakePrompts = useMemo(
    () => [t('recording.prompts.prompt1'), t('recording.prompts.prompt2'), t('recording.prompts.prompt3')],
    [t]
  );

  const recorder = useAudioRecorderMachine({
    onAudioReady: async ({ audioBlob, audioFileName: nextAudioFileName, audioMimeType, sourceType }) => {
      if (audioStorageKey) {
        await deleteAudioBlob(audioStorageKey);
      }

      if (audioDataUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioDataUrl);
      }

      const nextAudioStorageKey = await saveAudioBlob(audioBlob);
      const nextAudioDataUrl = URL.createObjectURL(audioBlob);

      largeUpload.reset();
      clearSelectedTopics();
      setAudioPayload({
        audioDataUrl: nextAudioDataUrl,
        audioStorageKey: nextAudioStorageKey,
        audioMimeType,
        audioFileName: nextAudioFileName,
        audioSourceType: sourceType
      });

      if (sourceType === 'uploaded') {
        toast.showSuccess(t('recording.toast.uploadedSuccess'));
        trackEvent('audio_uploaded', { mimeType: audioMimeType, sizeKb: Math.round(audioBlob.size / 1024) });
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

    if (file.size > VERY_LARGE_UPLOAD_MAX_BYTES) {
      toast.showError(t('recording.toast.tooLargeForLongUpload'));
      return;
    }

    if (file.size <= SMALL_UPLOAD_MAX_BYTES) {
      await recorder.handleAudioUpload(file);
      event.target.value = '';
      return;
    }

    toast.showInfo(t('recording.toast.longUploadStarted'));

    try {
      const result = await largeUpload.uploadFile(file);

      if (audioStorageKey) {
        await deleteAudioBlob(audioStorageKey);
      }

      if (audioDataUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioDataUrl);
      }

      const previewBlob = file.slice(0, Math.min(file.size, LARGE_UPLOAD_PREVIEW_BYTES), file.type || 'audio/mpeg');
      const nextAudioStorageKey = await saveAudioBlob(previewBlob);
      const previewUrl = URL.createObjectURL(previewBlob);

      clearSelectedTopics();
      setAudioPayload({
        audioDataUrl: previewUrl,
        audioStorageKey: nextAudioStorageKey,
        audioMimeType: file.type || 'audio/mpeg',
        audioFileName: file.name,
        audioSourceType: 'uploaded'
      });

      trackEvent('audio_uploaded', {
        mimeType: file.type || 'audio/mpeg',
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)),
        mode: 'large_worker',
        session: result.sessionId,
        digest: result.digest
      });
      toast.showSuccess(t('recording.toast.longUploadSuccess'));
    } catch {
      toast.showError(t('recording.toast.longUploadFailed'));
    }

    event.target.value = '';
  };

  const onReRecord = async () => {
    if (audioStorageKey) {
      await deleteAudioBlob(audioStorageKey);
    }

    if (audioDataUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(audioDataUrl);
    }

    recorder.resetMachine();
    largeUpload.reset();
    clearAudioPayload();
    clearSelectedTopics();
    toast.showInfo(t('recording.toast.cleared'));
  };

  const onUseDemoAudio = async () => {
    if (audioStorageKey) {
      await deleteAudioBlob(audioStorageKey);
    }

    if (audioDataUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(audioDataUrl);
    }

    const demoBlob = new Blob(['demo-audio'], { type: 'audio/webm' });
    const nextAudioStorageKey = await saveAudioBlob(demoBlob);

    clearSelectedTopics();
    largeUpload.reset();
    setAudioPayload({
      audioDataUrl: URL.createObjectURL(demoBlob),
      audioStorageKey: nextAudioStorageKey,
      audioMimeType: 'audio/webm',
      audioFileName: 'demo-audio.webm',
      audioSourceType: 'uploaded'
    });
    toast.showInfo(t('recording.toast.demoLoaded'));
  };

  const onDeleteAudioNow = async () => {
    if (audioStorageKey) {
      await deleteAudioBlob(audioStorageKey);
    }

    if (audioDataUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(audioDataUrl);
    }

    recorder.resetMachine();
    largeUpload.reset();
    clearAudioPayload();
    clearSelectedTopics();
    trackEvent('audio_deleted', { source: audioSourceType ?? 'unknown' });
    toast.showInfo(t('recording.toast.audioDeleted'));
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

        <Alert severity="info">
          <Stack spacing={0.75}>
            <Typography variant="body2">{t('recording.consent.title')}</Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <UIButton
                size="small"
                variant={hasConsent ? 'contained' : 'outlined'}
                onClick={() => {
                  setHasConsent((value) => !value);
                }}
              >
                {hasConsent ? t('recording.consent.enabled') : t('recording.consent.enable')}
              </UIButton>
              <Typography variant="caption" color="text.secondary">
                {t('recording.consent.note')}{' '}
                <Link href="https://www.aepsy.com/privacy" target="_blank" rel="noreferrer">
                  {t('recording.consent.privacyLink')}
                </Link>
              </Typography>
            </Stack>
          </Stack>
        </Alert>

        <Alert severity="success">
          <Stack spacing={1}>
            <Typography variant="body2">{t('recording.guidedPromptLabel')}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {intakePrompts[activePromptIndex]}
            </Typography>
            <Stack direction="row" spacing={1}>
              <UIButton
                size="small"
                variant="text"
                onClick={() => setActivePromptIndex((value) => (value - 1 + intakePrompts.length) % intakePrompts.length)}
              >
                {t('recording.actions.prevPrompt')}
              </UIButton>
              <UIButton
                size="small"
                variant="text"
                onClick={() => setActivePromptIndex((value) => (value + 1) % intakePrompts.length)}
              >
                {t('recording.actions.nextPrompt')}
              </UIButton>
            </Stack>
          </Stack>
        </Alert>

        {recorder.state.interrupted ? (
          <Alert severity="warning">{t('recording.interrupted')}</Alert>
        ) : null}

        {recorder.state.error ? <Alert severity="error">{recorder.state.error}</Alert> : null}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Tooltip title={!hasConsent ? t('recording.tooltips.consentRequired') : t('recording.tooltips.startRecording')}>
            <span>
              <UIButton
                onClick={() => {
                  trackEvent('record_started');
                  void recorder.startRecording();
                }}
                disabled={!recorder.canStart || !hasConsent}
                data-testid="record-start-button"
              >
                {t('recording.actions.start')}
              </UIButton>
            </span>
          </Tooltip>
          <UIButton
            variant="outlined"
            onClick={recorder.stopRecording}
            disabled={recorder.state.status !== 'recording'}
            data-testid="record-stop-button"
          >
            {t('recording.actions.stop')}
          </UIButton>
          <Tooltip title={hasAudio ? t('recording.tooltips.rerecord') : t('recording.tooltips.audioNeeded')}>
            <span>
              <UIButton
                variant="text"
                onClick={() => {
                  void onReRecord();
                }}
                disabled={!hasAudio}
                data-testid="record-rerecord-button"
              >
                {t('recording.actions.rerecord')}
              </UIButton>
            </span>
          </Tooltip>
          <Tooltip title={!hasConsent ? t('recording.tooltips.consentRequired') : t('recording.tooltips.uploadAudio')}>
            <span>
              <UIButton variant="outlined" onClick={onUploadClick} disabled={!hasConsent} data-testid="record-upload-button">
                {t('recording.actions.upload')}
              </UIButton>
            </span>
          </Tooltip>
          {process.env.NODE_ENV !== 'production' ? (
            <UIButton
              variant="text"
              onClick={() => {
                void onUseDemoAudio();
              }}
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

        <Alert severity="info">
          <Typography variant="body2">
            {t('recording.uploadPolicy', {
              smallMb: Math.round(SMALL_UPLOAD_MAX_BYTES / (1024 * 1024)),
              largeMb: Math.round(VERY_LARGE_UPLOAD_MAX_BYTES / (1024 * 1024))
            })}
          </Typography>
        </Alert>

        {largeUpload.state.status !== 'idle' ? (
          <Alert severity={largeUpload.state.status === 'error' ? 'error' : 'info'}>
            <Stack spacing={1}>
              <Typography variant="body2">
                {t('recording.longUpload.status', {
                  status: largeUpload.state.status,
                  progress: largeUpload.state.progress
                })}
              </Typography>
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: 'action.hover',
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${largeUpload.state.progress}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                      transition: 'width 180ms ease'
                    }}
                  />
                </Box>
              </Box>
              <Stack direction="row" spacing={1}>
                <UIButton
                  size="small"
                  variant="outlined"
                  onClick={largeUpload.pauseUpload}
                  disabled={largeUpload.state.status !== 'uploading'}
                >
                  {t('recording.actions.pauseUpload')}
                </UIButton>
                <UIButton
                  size="small"
                  variant="outlined"
                  onClick={largeUpload.resumeUpload}
                  disabled={largeUpload.state.status !== 'paused'}
                >
                  {t('recording.actions.resumeUpload')}
                </UIButton>
                <UIButton
                  size="small"
                  variant="text"
                  color="error"
                  onClick={largeUpload.cancelUpload}
                  disabled={!['uploading', 'paused'].includes(largeUpload.state.status)}
                >
                  {t('recording.actions.cancelUpload')}
                </UIButton>
              </Stack>
            </Stack>
          </Alert>
        ) : null}

        {hasAudio ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {t('recording.sourcePrefix')} {audioSourceType} {audioFileName ? `• ${audioFileName}` : ''}
            </Typography>
            {audioDataUrl ? (
              <audio controls src={audioDataUrl} style={{ width: '100%' }} data-testid="record-audio-player" />
            ) : (
              <Alert severity="info">{t('recording.restoringPreview')}</Alert>
            )}
          </Box>
        ) : (
          <Alert severity="info">{t('recording.noAudio')}</Alert>
        )}

        <Divider />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Tooltip title={hasAudio ? t('recording.tooltips.deleteAudio') : t('recording.tooltips.audioNeeded')}>
            <span>
              <UIButton
                variant="outlined"
                color="error"
                disabled={!hasAudio}
                onClick={() => {
                  setDeleteDialogOpen(true);
                }}
              >
                {t('recording.actions.deleteAudioNow')}
              </UIButton>
            </span>
          </Tooltip>
        </Stack>

        <Box
          sx={{
            position: { xs: 'sticky', md: 'static' },
            bottom: { xs: 12, md: 'auto' },
            zIndex: 5
          }}
        >
          <Tooltip title={hasAudio ? t('recording.tooltips.continue') : t('recording.tooltips.audioNeeded')}>
            <span>
              <UIButton
                disabled={!hasAudio}
                onClick={() => setStep('topics')}
                data-testid="record-continue-button"
              >
                {t('recording.actions.continue')}
              </UIButton>
            </span>
          </Tooltip>
        </Box>

        <Typography variant="caption" color="text.secondary" role="status" aria-live="polite">
          {t('recording.liveStatus')} {statusLabel(recorder.state.status, t)}.
        </Typography>
      </Stack>

      <UIConfirmDialog
        open={isDeleteDialogOpen}
        title={t('recording.deleteDialog.title')}
        description={t('recording.deleteDialog.description')}
        confirmLabel={t('recording.deleteDialog.confirm')}
        cancelLabel={t('recording.deleteDialog.cancel')}
        onConfirm={() => {
          setDeleteDialogOpen(false);
          void onDeleteAudioNow();
        }}
        onCancel={() => {
          setDeleteDialogOpen(false);
        }}
      />
    </UISectionCard>
  );
}
