import type { StateCreator } from 'zustand';

import type { AppState, TopicsSlice } from '@/shared/state/types';

export const createTopicsSlice: StateCreator<AppState, [], [], TopicsSlice> = (set, get) => ({
  selectedTopics: [],
  toggleTopic: (topic) =>
    set({
      selectedTopics: get().selectedTopics.includes(topic)
        ? get().selectedTopics.filter((item) => item !== topic)
        : [...get().selectedTopics, topic],
      lastUpdatedAt: Date.now()
    }),
  clearSelectedTopics: () =>
    set({
      selectedTopics: [],
      lastUpdatedAt: Date.now()
    })
});
