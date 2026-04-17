import type { StateCreator } from 'zustand';

import type { AppState, AudioSlice } from '@/shared/state/types';

export const createAudioSlice: StateCreator<AppState, [], [], AudioSlice> = (set) => ({
  audioDataUrl: null,
  audioStorageKey: null,
  audioMimeType: null,
  audioFileName: null,
  audioSourceType: null,
  setAudioPayload: ({ audioDataUrl, audioStorageKey, audioMimeType, audioFileName, audioSourceType }) =>
    set({
      audioDataUrl,
      audioStorageKey,
      audioMimeType,
      audioFileName,
      audioSourceType,
      lastUpdatedAt: Date.now()
    }),
  setAudioDataUrl: (audioDataUrl) =>
    set({
      audioDataUrl
    }),
  clearAudioPayload: () =>
    set({
      audioDataUrl: null,
      audioStorageKey: null,
      audioMimeType: null,
      audioFileName: null,
      audioSourceType: null,
      lastUpdatedAt: Date.now()
    })
});
