import type { StateCreator } from 'zustand';

import type { AppState, AudioSlice } from '@/shared/state/types';

export const createAudioSlice: StateCreator<AppState, [], [], AudioSlice> = (set) => ({
  audioDataUrl: null,
  audioMimeType: null,
  audioFileName: null,
  audioSourceType: null,
  setAudioPayload: ({ audioDataUrl, audioMimeType, audioFileName, audioSourceType }) =>
    set({
      audioDataUrl,
      audioMimeType,
      audioFileName,
      audioSourceType,
      lastUpdatedAt: Date.now()
    }),
  clearAudioPayload: () =>
    set({
      audioDataUrl: null,
      audioMimeType: null,
      audioFileName: null,
      audioSourceType: null,
      lastUpdatedAt: Date.now()
    })
});
