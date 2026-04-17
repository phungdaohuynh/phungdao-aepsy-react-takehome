'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createAudioSlice } from './slices/audio-slice';
import { createMetaSlice } from './slices/meta-slice';
import { createNavigationSlice } from './slices/navigation-slice';
import { createTopicsSlice } from './slices/topics-slice';
import type { AppState } from './types';

const initialStoreValues = {
  step: 'record' as const,
  selectedTopics: [] as string[],
  audioDataUrl: null as string | null,
  audioMimeType: null as string | null,
  audioFileName: null as string | null,
  audioSourceType: null as AppState['audioSourceType'],
  lastUpdatedAt: null as number | null,
  hasHydrated: false
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get, store) => ({
      ...createMetaSlice(set, get, store),
      ...createNavigationSlice(set, get, store),
      ...createTopicsSlice(set, get, store),
      ...createAudioSlice(set, get, store),
      reset: () =>
        set({
          ...initialStoreValues,
          hasHydrated: true
        })
    }),
    {
      name: 'aepsy-takehome-progress',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated(true);
      }
    }
  )
);

export type { AppState, AssignmentStep, AudioPayload, AudioSourceType } from './types';
