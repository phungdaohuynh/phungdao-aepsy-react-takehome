'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type UploadStatus = 'idle' | 'uploading' | 'paused' | 'success' | 'error' | 'canceled';

export type LargeUploadState = {
  status: UploadStatus;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  sessionId: string | null;
  error: string | null;
};

type WorkerEvent =
  | {
      type: 'PROGRESS';
      payload: {
        sessionId: string;
        uploadedBytes: number;
        totalBytes: number;
        progress: number;
      };
    }
  | {
      type: 'DONE';
      payload: {
        sessionId: string;
        digest: number;
      };
    }
  | {
      type: 'ERROR';
      payload: {
        sessionId: string;
        message: string;
      };
    }
  | {
      type: 'CANCELED';
      payload: {
        sessionId: string;
      };
    };

type WorkerCommand =
  | {
      type: 'START';
      payload: {
        sessionId: string;
        file: File;
        chunkSize: number;
      };
    }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'CANCEL' };

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;
const INITIAL_STATE: LargeUploadState = {
  status: 'idle',
  progress: 0,
  uploadedBytes: 0,
  totalBytes: 0,
  sessionId: null,
  error: null
};

function createSessionId() {
  return `upload_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function useLargeAudioUpload(chunkSize = DEFAULT_CHUNK_SIZE) {
  const [state, setState] = useState<LargeUploadState>(INITIAL_STATE);
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<{
    sessionId: string;
    resolve: (value: { sessionId: string; digest: number }) => void;
    reject: (reason?: unknown) => void;
  } | null>(null);

  const getWorker = useCallback(() => {
    if (workerRef.current) {
      return workerRef.current;
    }

    const worker = new Worker(new URL('../workers/large-audio.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerEvent>) => {
      const data = event.data;
      const pending = pendingRef.current;

      if (!pending) {
        return;
      }

      if (data.payload.sessionId !== pending.sessionId) {
        return;
      }

      if (data.type === 'PROGRESS') {
        setState((current) => ({
          ...current,
          status: current.status === 'paused' ? 'paused' : 'uploading',
          uploadedBytes: data.payload.uploadedBytes,
          totalBytes: data.payload.totalBytes,
          progress: data.payload.progress
        }));
        return;
      }

      if (data.type === 'DONE') {
        setState((current) => ({
          ...current,
          status: 'success',
          progress: 100,
          uploadedBytes: current.totalBytes
        }));
        pending.resolve({ sessionId: pending.sessionId, digest: data.payload.digest });
        pendingRef.current = null;
        return;
      }

      if (data.type === 'CANCELED') {
        setState((current) => ({ ...current, status: 'canceled', error: null }));
        pending.reject(new Error('Upload canceled.'));
        pendingRef.current = null;
        return;
      }

      if (data.type === 'ERROR') {
        setState((current) => ({ ...current, status: 'error', error: data.payload.message }));
        pending.reject(new Error(data.payload.message));
        pendingRef.current = null;
      }
    };

    return worker;
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const reset = useCallback(() => {
    if (pendingRef.current && workerRef.current) {
      workerRef.current.postMessage({ type: 'CANCEL' } satisfies WorkerCommand);
      pendingRef.current = null;
    }
    setState(INITIAL_STATE);
  }, []);

  const cancelUpload = useCallback(() => {
    if (!pendingRef.current || !workerRef.current) {
      return;
    }

    workerRef.current.postMessage({ type: 'CANCEL' } satisfies WorkerCommand);
    setState((current) => ({ ...current, status: 'canceled', error: null }));
  }, []);

  const pauseUpload = useCallback(() => {
    if (state.status !== 'uploading' || !workerRef.current) {
      return;
    }

    workerRef.current.postMessage({ type: 'PAUSE' } satisfies WorkerCommand);
    setState((current) => ({ ...current, status: 'paused' }));
  }, [state.status]);

  const resumeUpload = useCallback(() => {
    if (state.status !== 'paused' || !workerRef.current) {
      return;
    }

    workerRef.current.postMessage({ type: 'RESUME' } satisfies WorkerCommand);
    setState((current) => ({ ...current, status: 'uploading' }));
  }, [state.status]);

  const uploadFile = useCallback(
    async (file: File) => {
      const worker = getWorker();
      const sessionId = createSessionId();

      setState({
        status: 'uploading',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        sessionId,
        error: null
      });

      const result = await new Promise<{ sessionId: string; digest: number }>((resolve, reject) => {
        pendingRef.current = {
          sessionId,
          resolve,
          reject
        };

        worker.postMessage({
          type: 'START',
          payload: {
            sessionId,
            file,
            chunkSize
          }
        } satisfies WorkerCommand);
      });

      return result;
    },
    [chunkSize, getWorker]
  );

  return {
    state,
    uploadFile,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    reset
  };
}
