'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createAudioSlice } from '@/shared/state/slices/audio-slice';
import { createMetaSlice } from '@/shared/state/slices/meta-slice';
import { createNavigationSlice } from '@/shared/state/slices/navigation-slice';
import { createTopicsSlice } from '@/shared/state/slices/topics-slice';
import type { AppState } from '@/shared/state/types';

const initialStoreValues = {
  step: 'record' as const,
  selectedTopics: [] as string[],
  selectedTopicsPast: [] as string[][],
  selectedTopicsFuture: [] as string[][],
  audioDataUrl: null as string | null,
  audioStorageKey: null as string | null,
  audioMimeType: null as string | null,
  audioFileName: null as string | null,
  audioSourceType: null as AppState['audioSourceType'],
  recordingHistory: [] as AppState['recordingHistory'],
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
      partialize: (state) => ({
        ...state,
        audioDataUrl: null
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated(true);
      }
    }
  )
);

export type { AppState, AssignmentStep, AudioPayload, AudioSourceType } from '@/shared/state/types';
