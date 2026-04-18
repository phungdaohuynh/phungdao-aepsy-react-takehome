import type { StateCreator } from 'zustand';

import type { AppState, AudioSlice } from '@/shared/state/types';

export const createAudioSlice: StateCreator<AppState, [], [], AudioSlice> = (set) => ({
  audioDataUrl: null,
  audioStorageKey: null,
  audioMimeType: null,
  audioFileName: null,
  audioSourceType: null,
  recordingHistory: [],
  setAudioPayload: ({
    audioDataUrl,
    audioStorageKey,
    audioMimeType,
    audioFileName,
    audioSourceType,
  }) =>
    set({
      audioDataUrl,
      audioStorageKey,
      audioMimeType,
      audioFileName,
      audioSourceType,
      lastUpdatedAt: Date.now(),
    }),
  setAudioDataUrl: (audioDataUrl) =>
    set({
      audioDataUrl,
    }),
  setRecordingHistory: (recordingHistory) =>
    set({
      recordingHistory,
      lastUpdatedAt: Date.now(),
    }),
  addRecordingHistoryEntry: (entry) =>
    set((state) => ({
      recordingHistory: [
        entry,
        ...state.recordingHistory.filter((item) => item.audioStorageKey !== entry.audioStorageKey),
      ],
      lastUpdatedAt: Date.now(),
    })),
  removeRecordingHistoryEntry: (audioStorageKey) =>
    set((state) => ({
      recordingHistory: state.recordingHistory.filter(
        (item) => item.audioStorageKey !== audioStorageKey,
      ),
      lastUpdatedAt: Date.now(),
    })),
  clearRecordingHistory: () =>
    set({
      recordingHistory: [],
      lastUpdatedAt: Date.now(),
    }),
  clearAudioPayload: () =>
    set({
      audioDataUrl: null,
      audioStorageKey: null,
      audioMimeType: null,
      audioFileName: null,
      audioSourceType: null,
      lastUpdatedAt: Date.now(),
    }),
});
