import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAudioRecorderMachine } from '@/features/recording/hooks/use-audio-recorder-machine';

class FakeMediaRecorder extends EventTarget {
  public state: 'inactive' | 'recording' | 'paused' = 'inactive';
  public mimeType = 'audio/webm';

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.dispatchEvent(new Event('stop'));
  }

  pause() {
    this.state = 'paused';
    this.dispatchEvent(new Event('pause'));
  }

  resume() {
    this.state = 'recording';
    this.dispatchEvent(new Event('resume'));
  }
}

type GetUserMediaFn = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

function setMediaDevices(getUserMedia: GetUserMediaFn) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  });
}

function setMediaRecorder(ctor: typeof FakeMediaRecorder | undefined) {
  Object.defineProperty(window, 'MediaRecorder', {
    value: ctor,
    configurable: true,
  });
}

function createStreamMock(): MediaStream {
  return {
    getTracks: () =>
      [
        {
          stop: vi.fn(),
        },
      ] as unknown as MediaStreamTrack[],
  } as MediaStream;
}

describe('useAudioRecorderMachine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('maps microphone permission denial to a clear error message', async () => {
    setMediaRecorder(FakeMediaRecorder);
    setMediaDevices(async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    });

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAudioRecorderMachine({
        onAudioReady: vi.fn(),
        onError,
      }),
    );

    await act(async () => {
      await result.current.startRecording();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
    });

    expect(result.current.state.error).toBe(
      'Microphone permission denied. You can upload an audio file instead.',
    );
    expect(onError).toHaveBeenCalledWith(
      'Microphone permission denied. You can upload an audio file instead.',
    );
  });

  it('marks recording as interrupted when tab is hidden and does not crash with empty chunks', async () => {
    setMediaRecorder(FakeMediaRecorder);
    setMediaDevices(async () => createStreamMock());

    const { result } = renderHook(() =>
      useAudioRecorderMachine({
        onAudioReady: vi.fn(),
        onError: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.startRecording();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('recording');
    });

    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('stopped');
    });

    expect(result.current.state.interrupted).toBe(true);
    expect(result.current.state.error).toBeNull();
  });

  it('restores interrupted state from refresh/session and clears the session key', async () => {
    setMediaRecorder(FakeMediaRecorder);
    setMediaDevices(async () => createStreamMock());
    window.sessionStorage.setItem('aepsy-recording-interrupted', '1');

    const { result } = renderHook(() =>
      useAudioRecorderMachine({
        onAudioReady: vi.fn(),
        onError: vi.fn(),
      }),
    );

    await waitFor(() => {
      expect(result.current.state.interrupted).toBe(true);
    });

    expect(window.sessionStorage.getItem('aepsy-recording-interrupted')).toBeNull();
  });

  it('pauses and resumes recording before stopping', async () => {
    setMediaRecorder(FakeMediaRecorder);
    setMediaDevices(async () => createStreamMock());

    const { result } = renderHook(() =>
      useAudioRecorderMachine({
        onAudioReady: vi.fn(),
        onError: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.startRecording();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('recording');
    });

    act(() => {
      result.current.pauseRecording();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('paused');
      expect(result.current.canPause).toBe(false);
      expect(result.current.canResume).toBe(true);
    });

    act(() => {
      result.current.resumeRecording();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('recording');
      expect(result.current.canPause).toBe(true);
      expect(result.current.canResume).toBe(false);
    });

    act(() => {
      result.current.stopRecording();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe('error');
    });
  });
});
