import type { StateCreator } from 'zustand';

import type { AppState, MetaSlice } from '@/shared/state/types';

export const createMetaSlice: StateCreator<AppState, [], [], MetaSlice> = (set) => ({
  lastUpdatedAt: null,
  hasHydrated: false,
  markHydrated: (value) => set({ hasHydrated: value }),
});
