'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

type RecorderStatus =
  | 'idle'
  | 'unsupported'
  | 'requesting_permission'
  | 'ready'
  | 'recording'
  | 'stopped'
  | 'error';

type RecorderState = {
  status: RecorderStatus;
  error: string | null;
  interrupted: boolean;
};

type RecorderEvent =
  | { type: 'UNSUPPORTED' }
  | { type: 'REQUEST_PERMISSION' }
  | { type: 'READY' }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'INTERRUPTED' }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

const initialState: RecorderState = {
  status: 'idle',
  error: null,
  interrupted: false
};

function reducer(state: RecorderState, event: RecorderEvent): RecorderState {
  switch (event.type) {
    case 'UNSUPPORTED':
      return {
        status: 'unsupported',
        error: 'This browser does not support audio recording.',
        interrupted: false
      };
    case 'REQUEST_PERMISSION':
      return { status: 'requesting_permission', error: null, interrupted: false };
    case 'READY':
      return { status: 'ready', error: null, interrupted: false };
    case 'START_RECORDING':
      return { status: 'recording', error: null, interrupted: false };
    case 'STOP_RECORDING':
      return { status: 'stopped', error: null, interrupted: state.interrupted };
    case 'INTERRUPTED':
      return {
        status: state.status === 'recording' ? 'stopped' : state.status,
        error: null,
        interrupted: true
      };
    case 'ERROR':
      return { status: 'error', error: event.message, interrupted: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export type RecorderOutput = {
  audioBlob: Blob;
  audioMimeType: string;
  audioFileName: string;
  sourceType: 'recorded' | 'uploaded';
};

type UseAudioRecorderMachineParams = {
  onAudioReady: (payload: RecorderOutput) => Promise<void> | void;
  onError?: (message: string) => void;
};

export function useAudioRecorderMachine({ onAudioReady, onError }: UseAudioRecorderMachineParams) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const clearRecorder = useCallback(() => {
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    stopStreamTracks();
  }, [stopStreamTracks]);

  const handleError = useCallback(
    (message: string) => {
      dispatch({ type: 'ERROR', message });
      onError?.(message);
      clearRecorder();
    },
    [clearRecorder, onError]
  );

  const startRecording = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      dispatch({ type: 'UNSUPPORTED' });
      return;
    }

    dispatch({ type: 'REQUEST_PERMISSION' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener('stop', async () => {
        try {
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mimeType });

          if (!blob.size) {
            handleError('No audio captured. Please try recording again.');
            return;
          }

          await onAudioReady({
            audioBlob: blob,
            audioMimeType: mimeType,
            audioFileName: `voice-note-${Date.now()}.webm`,
            sourceType: 'recorded'
          });

          dispatch({ type: 'STOP_RECORDING' });
          clearRecorder();
        } catch {
          handleError('Unable to process recorded audio.');
        }
      });

      dispatch({ type: 'READY' });
      recorder.start();
      dispatch({ type: 'START_RECORDING' });
    } catch (error) {
      const typedError = error as DOMException;

      if (typedError?.name === 'NotAllowedError') {
        handleError('Microphone permission denied. You can upload an audio file instead.');
        return;
      }

      handleError('Unable to start recording. Please check your microphone settings.');
    }
  }, [clearRecorder, handleError, onAudioReady]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    if (!recorder) {
      return;
    }

    if (recorder.state === 'recording') {
      recorder.stop();
    }
  }, []);

  const handleAudioUpload = useCallback(
    async (file: File) => {
      try {
        await onAudioReady({
          audioBlob: file,
          audioMimeType: file.type || 'audio/mpeg',
          audioFileName: file.name,
          sourceType: 'uploaded'
        });

        dispatch({ type: 'STOP_RECORDING' });
      } catch {
        handleError('Unable to read the selected audio file.');
      }
    },
    [handleError, onAudioReady]
  );

  const resetMachine = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    clearRecorder();
    dispatch({ type: 'RESET' });
  }, [clearRecorder]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
        dispatch({ type: 'INTERRUPTED' });
      }
    };

    const onBeforeUnload = () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);

      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      clearRecorder();
    };
  }, [clearRecorder]);

  const canStart = useMemo(() => state.status !== 'recording' && state.status !== 'requesting_permission', [state.status]);

  return {
    state,
    canStart,
    startRecording,
    stopRecording,
    resetMachine,
    handleAudioUpload
  };
}
