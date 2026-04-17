import type { StateCreator } from 'zustand';

import type { AppState, NavigationSlice } from '@/shared/state/types';

export const createNavigationSlice: StateCreator<AppState, [], [], NavigationSlice> = (set) => ({
  step: 'record',
  setStep: (step) =>
    set({
      step,
      lastUpdatedAt: Date.now()
    })
});
