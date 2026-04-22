'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type MouseEvent,
} from 'react';
import { useTranslation } from '@workspace/localization';
import {
  Alert,
  Box,
  Chip,
  Divider,
  Tooltip,
  Stack,
  Typography,
  UIButton,
  UIConfirmDialog,
  UISectionCard,
  useUIToast,
} from '@workspace/ui';

import {
  LARGE_UPLOAD_PREVIEW_BYTES,
  SMALL_UPLOAD_MAX_BYTES,
  VERY_LARGE_UPLOAD_MAX_BYTES,
} from '@/features/recording/constants/recording';
import { useAudioRecorderMachine } from '@/features/recording/hooks/use-audio-recorder-machine';
import { useLargeAudioUpload } from '@/features/recording/hooks/use-large-audio-upload';
import { statusColor, statusLabel } from '@/features/recording/lib/recorder-status';
import { trackEvent } from '@/shared/lib/analytics';
import {
  getAudioBlob,
  saveAudioBlob,
} from '@/shared/lib/audio-storage';
import { useAppStore } from '@/shared/state/store';

const LARGE_UPLOAD_IN_PROGRESS_SESSION_KEY = 'aepsy-large-upload-in-progress';
const WAVEFORM_BAR_COUNT = 220;

const formatRecordingElapsed = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const formatAudioDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}.0`;
};

const toFileExtensionFromMime = (mimeType: string) => {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('mpeg') || normalized.includes('mp3')) {
    return 'mp3';
  }
  if (normalized.includes('wav')) {
    return 'wav';
  }
  if (normalized.includes('ogg')) {
    return 'ogg';
  }
  if (normalized.includes('webm')) {
    return 'webm';
  }
  if (normalized.includes('m4a') || normalized.includes('mp4')) {
    return 'm4a';
  }
  if (normalized.includes('aac')) {
    return 'aac';
  }
  if (normalized.includes('flac')) {
    return 'flac';
  }
  return null;
};

const inferAudioMimeType = (file: File) => {
  if (file.type.startsWith('audio/')) {
    return file.type;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    case 'm4a':
      return 'audio/mp4';
    case 'webm':
      return 'audio/webm';
    case 'ogg':
      return 'audio/ogg';
    case 'aac':
      return 'audio/aac';
    case 'flac':
      return 'audio/flac';
    default:
      return null;
  }
};

const validatePlayableAudio = async (file: File, timeoutMs = 12_000) => {
  const objectUrl = URL.createObjectURL(file);

  try {
    await new Promise<void>((resolve, reject) => {
      const audio = document.createElement('audio');
      let settled = false;

      const cleanup = () => {
        audio.removeAttribute('src');
        audio.load();
      };

      const finishResolve = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const finishReject = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(new Error('Invalid audio file.'));
      };

      const timeoutId = window.setTimeout(() => {
        finishReject();
      }, timeoutMs);

      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        window.clearTimeout(timeoutId);
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          finishReject();
          return;
        }
        finishResolve();
      };
      audio.onerror = () => {
        window.clearTimeout(timeoutId);
        finishReject();
      };
      audio.src = objectUrl;
      audio.load();
    });

    return true;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export function StepRecording() {
  const { t } = useTranslation();
  const toast = useUIToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isClosePanelDialogOpen, setClosePanelDialogOpen] = useState(false);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const [previewCurrentSeconds, setPreviewCurrentSeconds] = useState(0);
  const [previewDurationSeconds, setPreviewDurationSeconds] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isAudioSaved, setIsAudioSaved] = useState(false);
  const [isDragOverRecorder, setIsDragOverRecorder] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [showLargeUploadInterruptionWarning, setShowLargeUploadInterruptionWarning] = useState(
    () => {
      if (typeof window === 'undefined') {
        return false;
      }

      const wasInProgress =
        window.sessionStorage.getItem(LARGE_UPLOAD_IN_PROGRESS_SESSION_KEY) === '1';
      if (wasInProgress) {
        window.sessionStorage.removeItem(LARGE_UPLOAD_IN_PROGRESS_SESSION_KEY);
      }

      return wasInProgress;
    },
  );

  const audioDataUrl = useAppStore((state) => state.audioDataUrl);
  const audioStorageKey = useAppStore((state) => state.audioStorageKey);
  const audioMimeType = useAppStore((state) => state.audioMimeType);
  const audioFileName = useAppStore((state) => state.audioFileName);
  const setAudioPayload = useAppStore((state) => state.setAudioPayload);
  const clearAudioPayload = useAppStore((state) => state.clearAudioPayload);
  const clearSelectedTopics = useAppStore((state) => state.clearSelectedTopics);
  const setStep = useAppStore((state) => state.setStep);
  const hasAudio = Boolean(audioDataUrl || audioStorageKey);
  const recorderStatusRef = useRef('idle');
  const largeUpload = useLargeAudioUpload();
  const waveformBars = useMemo(() => {
    const seed = `${audioStorageKey ?? ''}${audioDataUrl ?? ''}`
      .split('')
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);

    return Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
      const baseline = 2 + (Math.sin((index + seed) * 0.25) + 1) * 4;
      const burst = ((index + seed) % 37 === 0 ? 12 : 0) + ((index + seed) % 53 === 0 ? 8 : 0);
      return Math.min(20, baseline + burst);
    });
  }, [audioDataUrl, audioStorageKey]);
  const waveformBarWidth = useMemo(
    () => `calc((100% - ${(waveformBars.length - 1) * 1}px) / ${waveformBars.length})`,
    [waveformBars.length],
  );
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const isInProgress =
      largeUpload.state.status === 'uploading' || largeUpload.state.status === 'paused';
    if (isInProgress) {
      window.sessionStorage.setItem(LARGE_UPLOAD_IN_PROGRESS_SESSION_KEY, '1');
      return;
    }

    window.sessionStorage.removeItem(LARGE_UPLOAD_IN_PROGRESS_SESSION_KEY);
  }, [largeUpload.state.status]);

  const recorder = useAudioRecorderMachine({
    onAudioReady: async ({
      audioBlob,
      audioFileName: nextAudioFileName,
      audioMimeType,
      sourceType,
    }) => {
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
        audioSourceType: sourceType,
      });

      if (sourceType === 'uploaded') {
        toast.showSuccess(t('recording.toast.uploadedSuccess'));
        trackEvent('audio_uploaded', {
          mimeType: audioMimeType,
          sizeKb: Math.round(audioBlob.size / 1024),
        });
      } else {
        toast.showSuccess(t('recording.toast.recordedSuccess'));
        trackEvent('record_stopped', { mimeType: audioMimeType });
      }

    },
    onError: (message) => {
      toast.showError(message);
    },
  });
  const isRecordingMode = ['recording', 'paused'].includes(recorder.state.status);

  useEffect(() => {
    const previousStatus = recorderStatusRef.current;

    if (
      recorder.state.status === 'recording' &&
      !['recording', 'paused'].includes(previousStatus)
    ) {
      setRecordingElapsedSeconds(0);
    }

    recorderStatusRef.current = recorder.state.status;
  }, [recorder.state.status]);

  useEffect(() => {
    if (recorder.state.status !== 'recording') {
      return;
    }

    const intervalId = window.setInterval(() => {
      setRecordingElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [recorder.state.status]);

  useEffect(() => {
    setIsAudioSaved(false);
    setPreviewCurrentSeconds(0);
    setPreviewDurationSeconds(0);
    setIsPreviewPlaying(false);
  }, [audioStorageKey]);

  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onTogglePreviewAudio = async () => {
    const audioEl = previewAudioRef.current;
    if (!audioEl || !audioDataUrl) {
      return;
    }

    if (isPreviewPlaying) {
      audioEl.pause();
      setIsPreviewPlaying(false);
      return;
    }

    try {
      await audioEl.play();
      setIsPreviewPlaying(true);
    } catch {
      toast.showError(t('recording.toast.operationFailed'));
    }
  };

  const onSeekPreviewAudio = async (event: MouseEvent<HTMLDivElement>) => {
    const audioEl = previewAudioRef.current;
    if (!audioEl) {
      return;
    }

    const duration = Number.isFinite(audioEl.duration) && audioEl.duration > 0
      ? audioEl.duration
      : previewDurationSeconds;
    if (duration <= 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const targetTime = ratio * duration;

    audioEl.currentTime = targetTime;
    setPreviewCurrentSeconds(targetTime);

    if (!isPreviewPlaying) {
      try {
        await audioEl.play();
        setIsPreviewPlaying(true);
      } catch {
        toast.showError(t('recording.toast.operationFailed'));
      }
    }
  };

  const onSaveAudioNow = async () => {
    try {
      let blob: Blob | null = null;

      if (audioStorageKey) {
        blob = await getAudioBlob(audioStorageKey);
      }

      if (!blob && audioDataUrl) {
        const response = await fetch(audioDataUrl);
        blob = await response.blob();
      }

      if (!blob) {
        throw new Error(t('recording.noAudio'));
      }

      const fallbackName = `voice-note-${Date.now()}`;
      const baseName = audioFileName ? audioFileName.replace(/\.[^/.]+$/, '') : fallbackName;
      const effectiveMimeType = blob.type || audioMimeType || '';
      const extensionFromMime = effectiveMimeType ? toFileExtensionFromMime(effectiveMimeType) : null;
      const extensionFromName = audioFileName?.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() ?? null;
      const nextExtension = extensionFromMime ?? extensionFromName ?? 'webm';
      const nextFileName = `${baseName}.${nextExtension}`;
      const normalizedBlob = effectiveMimeType
        ? blob.type === effectiveMimeType
          ? blob
          : new Blob([blob], { type: effectiveMimeType })
        : blob;
      const downloadUrl = URL.createObjectURL(normalizedBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = nextFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      setIsAudioSaved(true);
      toast.showSuccess(t('recording.toast.saved'));
    } catch (error) {
      toast.showError(toErrorMessage(error));
    }
  };

  const toErrorMessage = (error: unknown, fallbackKey = 'recording.toast.operationFailed') => {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    return t(fallbackKey);
  };

  const processAudioFile = async (file: File | null) => {
    if (!file) {
      return;
    }

    const isAudioByMime = file.type.startsWith('audio/');
    const isAudioByName = /\.(mp3|wav|m4a|webm|ogg|aac|flac)$/i.test(file.name);
    const inferredMimeType = inferAudioMimeType(file);

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
      return;
    }

    toast.showInfo(t('recording.toast.longUploadStarted'));

    const isPlayableAudio = await validatePlayableAudio(file);
    if (!isPlayableAudio) {
      toast.showError(t('recording.toast.invalidAudio'));
      return;
    }

    try {
      const result = await largeUpload.uploadFile(file);

      if (audioDataUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioDataUrl);
      }

      const previewBlob = file.slice(
        0,
        Math.min(file.size, LARGE_UPLOAD_PREVIEW_BYTES),
        inferredMimeType || 'audio/mpeg',
      );
      const nextAudioStorageKey = await saveAudioBlob(previewBlob);
      const previewUrl = URL.createObjectURL(file);

      clearSelectedTopics();
      setAudioPayload({
        audioDataUrl: previewUrl,
        audioStorageKey: nextAudioStorageKey,
        audioMimeType: inferredMimeType || 'audio/mpeg',
        audioFileName: file.name,
        audioSourceType: 'uploaded',
      });

      trackEvent('audio_uploaded', {
        mimeType: inferredMimeType || 'audio/mpeg',
        sizeMb: Number((file.size / (1024 * 1024)).toFixed(1)),
        mode: 'large_worker',
        session: result.sessionId,
        digest: result.digest,
      });
      toast.showSuccess(t('recording.toast.uploadedSuccess'));

    } catch (error) {
      toast.showError(toErrorMessage(error, 'recording.toast.longUploadFailed'));
    }
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    await processAudioFile(file);
    event.target.value = '';
  };

  const onRecorderDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragOverRecorder) {
      setIsDragOverRecorder(true);
    }
  };

  const onRecorderDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }
    setIsDragOverRecorder(false);
  };

  const onRecorderDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOverRecorder(false);

    if (isRecordingMode) {
      toast.showInfo(t('recording.notSavedUntilStopped'));
      return;
    }

    const file = event.dataTransfer.files?.[0] ?? null;
    await processAudioFile(file);
  };

  const onReRecord = async () => {
    try {
      if (audioDataUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioDataUrl);
      }

      recorder.resetMachine();
      largeUpload.reset();
      clearAudioPayload();
      clearSelectedTopics();
      toast.showInfo(t('recording.toast.cleared'));
    } catch (error) {
      toast.showError(toErrorMessage(error));
    }
  };

  return (
    <UISectionCard
      title={t('recording.title')}
      subheader={t('recording.subheader')}
      action={
        <Chip
          label={statusLabel(recorder.state.status, t)}
          color={statusColor(recorder.state.status)}
        />
      }
    >
      <Stack spacing={2} data-testid="step-recording">
        <Typography color="text.secondary">{t('recording.description')}</Typography>

        {recorder.state.interrupted ? (
          <Alert severity="warning">{t('recording.interrupted')}</Alert>
        ) : null}

        {['recording', 'paused'].includes(recorder.state.status) ? (
          <Alert severity="warning">{t('recording.notSavedUntilStopped')}</Alert>
        ) : null}

        {showLargeUploadInterruptionWarning ? (
          <Alert
            severity="warning"
            onClose={() => {
              setShowLargeUploadInterruptionWarning(false);
            }}
          >
            {t('recording.largeUploadInterruptedAfterRefresh')}
          </Alert>
        ) : null}

        {recorder.state.error ? <Alert severity="error">{recorder.state.error}</Alert> : null}

        <Box
          onDragOver={onRecorderDragOver}
          onDragEnter={onRecorderDragOver}
          onDragLeave={onRecorderDragLeave}
          onDrop={(event) => {
            void onRecorderDrop(event);
          }}
          sx={{
            borderRadius: 2,
            minHeight: { xs: 220, md: 250 },
            px: { xs: 2, md: 3 },
            py: { xs: 2.5, md: 3 },
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: isRecordingMode ? 'space-between' : 'center',
            bgcolor: 'recording.dark',
            backgroundImage: (theme) =>
              `linear-gradient(180deg, ${theme.palette.recording.main} 0%, ${theme.palette.recording.dark} 100%)`,
            outline: isDragOverRecorder ? '2px dashed' : 'none',
            outlineColor: isDragOverRecorder ? 'recording.light' : 'transparent',
            outlineOffset: isDragOverRecorder ? '-8px' : 0,
            boxShadow: isDragOverRecorder ? (theme) => theme.shadows[6] : 'none',
            transition: 'outline-color 120ms ease, box-shadow 120ms ease',
          }}
        >
          {isDragOverRecorder ? (
            <Typography
              sx={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'common.white',
                fontWeight: 600,
                pointerEvents: 'none',
              }}
            >
              {t('recording.actions.upload')}
            </Typography>
          ) : null}
          {isRecordingMode ? (
            <>
              <Box sx={{ pt: 1 }}>
                <Box
                  sx={{
                    position: 'relative',
                    height: 1,
                    bgcolor: 'action.selected',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -0.5,
                      left: 0,
                      height: 2,
                      width: `${4 + ((recordingElapsedSeconds * 8) % 96)}%`,
                      bgcolor: 'recording.light',
                      borderRadius: 99,
                    }}
                  />
                </Box>
              </Box>
              <Stack direction="row" spacing={1.5} sx={{ alignSelf: 'center', mt: 'auto' }}>
                <Tooltip title={t('recording.actions.complete')}>
                  <span>
                    <UIButton
                      onClick={recorder.stopRecording}
                      data-testid="record-stop-button"
                      aria-label={t('recording.actions.complete')}
                      sx={{
                        borderRadius: 999,
                        minHeight: 44,
                        px: 2,
                        bgcolor: 'success.dark',
                        color: 'error.main',
                        transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
                        '&:hover': {
                          bgcolor: 'success.dark',
                          boxShadow: (theme) => theme.shadows[6],
                          filter: 'brightness(1.04)',
                        },
                        '&:active': {
                          transform: 'translateY(1px) scale(0.98)',
                          boxShadow: (theme) => theme.shadows[2],
                        },
                        '&:focus-visible': {
                          outline: (theme) => `2px solid ${theme.palette.primary.light}`,
                          outlineOffset: 2,
                        },
                      }}
                    >
                      <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: 'error.main' }} />
                        <Typography sx={{ color: 'error.main', fontWeight: 700 }}>
                          {formatRecordingElapsed(recordingElapsedSeconds)}
                        </Typography>
                      </Stack>
                    </UIButton>
                  </span>
                </Tooltip>

                {recorder.state.status === 'recording' ? (
                  <Tooltip title={t('recording.actions.pause')}>
                    <span>
                      <UIButton
                        onClick={recorder.pauseRecording}
                        data-testid="record-pause-button"
                        aria-label={t('recording.actions.pause')}
                        sx={{
                          minWidth: 44,
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          color: 'common.white',
                          transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
                          '&:hover': {
                            bgcolor: 'success.main',
                            boxShadow: (theme) => theme.shadows[6],
                            filter: 'brightness(1.05)',
                          },
                          '&:active': {
                            transform: 'translateY(1px) scale(0.96)',
                            boxShadow: (theme) => theme.shadows[2],
                          },
                          '&:focus-visible': {
                            outline: (theme) => `2px solid ${theme.palette.primary.light}`,
                            outlineOffset: 2,
                          },
                        }}
                      >
                        II
                      </UIButton>
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip title={t('recording.actions.resume')}>
                    <span>
                      <UIButton
                        onClick={recorder.resumeRecording}
                        data-testid="record-resume-button"
                        aria-label={t('recording.actions.resume')}
                        sx={{
                          minWidth: 44,
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          color: 'common.white',
                          transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
                          '&:hover': {
                            bgcolor: 'success.main',
                            boxShadow: (theme) => theme.shadows[6],
                            filter: 'brightness(1.05)',
                          },
                          '&:active': {
                            transform: 'translateY(1px) scale(0.96)',
                            boxShadow: (theme) => theme.shadows[2],
                          },
                          '&:focus-visible': {
                            outline: (theme) => `2px solid ${theme.palette.primary.light}`,
                            outlineOffset: 2,
                          },
                        }}
                      >
                        ▶
                      </UIButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            </>
          ) : hasAudio ? (
            <Stack spacing={1.1} sx={{ position: 'relative', pt: 0.5 }}>
              <UIButton
                variant="text"
                onClick={() => {
                  setClosePanelDialogOpen(true);
                }}
                sx={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  color: 'common.white',
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.selected',
                  backdropFilter: 'blur(2px)',
                  px: 0,
                  lineHeight: 1,
                  zIndex: 2,
                  transition: 'transform 120ms ease, background-color 120ms ease, border-color 120ms ease',
                  '&:hover': {
                    bgcolor: 'action.selected',
                    borderColor: 'text.secondary',
                  },
                  '&:active': {
                    transform: 'translateY(1px) scale(0.96)',
                  },
                }}
              >
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  sx={{ width: 20, height: 20, display: 'block' }}
                >
                  <Box
                    component="path"
                    d="M6 6L18 18M18 6L6 18"
                    sx={{
                      stroke: 'currentColor',
                      strokeWidth: 2.2,
                      strokeLinecap: 'round',
                    }}
                  />
                </Box>
              </UIButton>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'common.white' }}>
                  {formatAudioDuration(previewCurrentSeconds)}
                </Typography>
              </Stack>

              <Box
                sx={{
                  borderRadius: 1,
                  px: 1,
                  py: 1.2,
                  bgcolor: 'action.hover',
                }}
              >
                <Box
                  onClick={(event) => {
                    void onSeekPreviewAudio(event);
                  }}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1px',
                    height: 44,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: previewDurationSeconds > 0
                        ? `${(previewCurrentSeconds / previewDurationSeconds) * 100}%`
                        : 0,
                      bgcolor: 'action.selected',
                      pointerEvents: 'none',
                    }}
                  />
                  {waveformBars.map((height, index) => (
                    <Box
                      key={`bar-${index}`}
                      sx={{
                        position: 'relative',
                        width: waveformBarWidth,
                        flexShrink: 0,
                        height,
                        borderRadius: 99,
                        bgcolor: 'success.light',
                        opacity:
                          previewDurationSeconds > 0 &&
                          index / waveformBars.length <
                            previewCurrentSeconds / Math.max(1, previewDurationSeconds)
                            ? 1
                            : 0.5,
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'success.light' }}>
                  {formatAudioDuration(previewCurrentSeconds)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'success.light' }}>
                  {formatAudioDuration(previewDurationSeconds)}
                </Typography>
              </Stack>

              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <UIButton
                  onClick={() => {
                    void onTogglePreviewAudio();
                  }}
                  sx={{
                    borderRadius: 999,
                    minWidth: 72,
                    bgcolor: 'success.dark',
                    color: 'common.white',
                    transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
                    '&:hover': {
                      bgcolor: 'success.dark',
                      boxShadow: (theme) => theme.shadows[6],
                      filter: 'brightness(1.04)',
                    },
                    '&:active': {
                      transform: 'translateY(1px) scale(0.98)',
                      boxShadow: (theme) => theme.shadows[2],
                    },
                  }}
                >
                  {isPreviewPlaying ? t('recording.recorderPanel.pausePreview') : '▶'}
                </UIButton>
                <UIButton
                  variant={isAudioSaved ? 'contained' : 'outlined'}
                  onClick={() => {
                    void onSaveAudioNow();
                  }}
                  sx={{
                    borderRadius: 999,
                    px: 3,
                    borderColor: 'common.white',
                    color: isAudioSaved ? 'primary.dark' : 'common.white',
                    bgcolor: isAudioSaved ? 'common.white' : 'transparent',
                    transition: 'transform 120ms ease, background-color 120ms ease, border-color 120ms ease',
                    '&:hover': {
                      borderColor: 'common.white',
                      bgcolor: isAudioSaved ? 'common.white' : 'action.hover',
                    },
                    '&:active': {
                      transform: 'translateY(1px) scale(0.98)',
                    },
                  }}
                >
                  {isAudioSaved
                    ? t('recording.recorderPanel.savedButton')
                    : t('recording.recorderPanel.saveButton')}
                </UIButton>
              </Stack>

              <audio
                ref={previewAudioRef}
                src={audioDataUrl ?? undefined}
                style={{ display: 'none' }}
                onLoadedMetadata={(event) => {
                  const duration = Number.isFinite(event.currentTarget.duration)
                    ? event.currentTarget.duration
                    : 0;
                  setPreviewDurationSeconds(duration);
                }}
                onTimeUpdate={(event) => {
                  setPreviewCurrentSeconds(event.currentTarget.currentTime || 0);
                }}
                onPause={() => setIsPreviewPlaying(false)}
                onPlay={() => setIsPreviewPlaying(true)}
                onEnded={() => {
                  setIsPreviewPlaying(false);
                  setPreviewCurrentSeconds(0);
                }}
              />
            </Stack>
          ) : (
            <Stack spacing={4} sx={{ alignItems: 'center', justifyContent: 'center' }}>
              <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ color: 'common.white', opacity: 0.78, fontSize: '1rem' }}>
                  {t('recording.recorderPanel.idleHint')}
                </Typography>
                <Tooltip
                  title={t('recording.tooltips.uploadAudio')}
                >
                  <span>
                    <UIButton
                      variant="outlined"
                      onClick={onUploadClick}
                      data-testid="record-upload-button"
                      sx={{
                        borderRadius: 999,
                        px: 2,
                        borderColor: 'divider',
                        color: 'common.white',
                        transition: 'transform 120ms ease, background-color 120ms ease, border-color 120ms ease',
                        '&:hover': {
                          borderColor: 'common.white',
                          bgcolor: 'action.hover',
                        },
                        '&:active': {
                          transform: 'translateY(1px) scale(0.98)',
                        },
                      }}
                    >
                      {t('recording.actions.upload')}
                    </UIButton>
                  </span>
                </Tooltip>
              </Stack>
              <Tooltip
                title={t('recording.tooltips.startRecording')}
              >
                <span>
                    <UIButton
                      onClick={() => {
                        trackEvent('record_started');
                        void recorder.startRecording();
                      }}
                      disabled={!recorder.canStart}
                      data-testid="record-start-button"
                    sx={{
                      minWidth: 50,
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      bgcolor: 'success.dark',
                      color: 'error.main',
                      fontSize: '1.4rem',
                      transition: 'transform 120ms ease, box-shadow 120ms ease, filter 120ms ease',
                      '&:hover': {
                        bgcolor: 'success.dark',
                        boxShadow: (theme) => theme.shadows[8],
                        filter: 'brightness(1.06)',
                      },
                      '&:active': {
                        transform: 'translateY(1px) scale(0.96)',
                        boxShadow: (theme) => theme.shadows[3],
                      },
                      '&:focus-visible': {
                        outline: (theme) => `2px solid ${theme.palette.primary.light}`,
                        outlineOffset: 2,
                      },
                    }}
                  >
                    ●
                  </UIButton>
                </span>
              </Tooltip>
            </Stack>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,audio/*"
            style={{ display: 'none' }}
            data-testid="record-upload-input"
            onChange={(event) => {
              void onFileChange(event);
            }}
          />
        </Box>

        <Alert severity="info">
          <Typography variant="body2">
            {t('recording.uploadPolicy', {
              smallMb: Math.round(SMALL_UPLOAD_MAX_BYTES / (1024 * 1024)),
              largeMb: Math.round(VERY_LARGE_UPLOAD_MAX_BYTES / (1024 * 1024)),
            })}
          </Typography>
        </Alert>

        {['uploading', 'paused', 'error'].includes(largeUpload.state.status) ? (
          <Alert severity={largeUpload.state.status === 'error' ? 'error' : 'info'}>
            <Stack spacing={1}>
              <Typography variant="body2">
                {t('recording.longUpload.status', {
                  status: largeUpload.state.status,
                  progress: largeUpload.state.progress,
                })}
              </Typography>
              <Box sx={{ width: '100%' }}>
                <Box
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: 'action.hover',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      width: `${largeUpload.state.progress}%`,
                      height: '100%',
                      bgcolor: 'primary.main',
                      transition: 'width 180ms ease',
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

        <Divider />

        <Box
          sx={{
            position: { xs: 'sticky', md: 'static' },
            bottom: { xs: 12, md: 'auto' },
            zIndex: 5,
          }}
        >
          <Tooltip
            title={
              hasAudio ? t('recording.tooltips.continue') : t('recording.tooltips.audioNeeded')
            }
          >
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

      </Stack>

      <UIConfirmDialog
        open={isClosePanelDialogOpen}
        title={t('recording.closeDialog.title')}
        description={t('recording.closeDialog.description')}
        confirmLabel={t('recording.closeDialog.confirm')}
        cancelLabel={t('recording.closeDialog.cancel')}
        onConfirm={() => {
          setClosePanelDialogOpen(false);
          void onReRecord();
        }}
        onCancel={() => {
          setClosePanelDialogOpen(false);
        }}
      />
    </UISectionCard>
  );
}
