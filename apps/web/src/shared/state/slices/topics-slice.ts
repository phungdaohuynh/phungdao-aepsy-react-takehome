import type { StateCreator } from 'zustand';

import type { AppState, TopicsSlice } from '@/shared/state/types';

const MAX_HISTORY = 30;

function nextHistory(past: string[][], snapshot: string[]) {
  return [...past, snapshot].slice(-MAX_HISTORY);
}

export const createTopicsSlice: StateCreator<AppState, [], [], TopicsSlice> = (set, get) => ({
  selectedTopics: [],
  selectedTopicsPast: [],
  selectedTopicsFuture: [],
  setSelectedTopics: (topics) =>
    set((state) => ({
      selectedTopics: topics,
      selectedTopicsPast: nextHistory(state.selectedTopicsPast, state.selectedTopics),
      selectedTopicsFuture: [],
      lastUpdatedAt: Date.now()
    })),
  toggleTopic: (topic) =>
    set((state) => ({
      selectedTopics: state.selectedTopics.includes(topic)
        ? state.selectedTopics.filter((item) => item !== topic)
        : [...state.selectedTopics, topic],
      selectedTopicsPast: nextHistory(state.selectedTopicsPast, state.selectedTopics),
      selectedTopicsFuture: [],
      lastUpdatedAt: Date.now()
    })),
  clearSelectedTopics: () =>
    set((state) => ({
      selectedTopics: [],
      selectedTopicsPast: state.selectedTopics.length > 0 ? nextHistory(state.selectedTopicsPast, state.selectedTopics) : state.selectedTopicsPast,
      selectedTopicsFuture: [],
      lastUpdatedAt: Date.now()
    })),
  undoTopicSelection: () => {
    const { selectedTopicsPast, selectedTopics, selectedTopicsFuture } = get();
    const previous = selectedTopicsPast[selectedTopicsPast.length - 1];

    if (!previous) {
      return;
    }

    set({
      selectedTopics: previous,
      selectedTopicsPast: selectedTopicsPast.slice(0, -1),
      selectedTopicsFuture: [selectedTopics, ...selectedTopicsFuture].slice(0, MAX_HISTORY),
      lastUpdatedAt: Date.now()
    });
  },
  redoTopicSelection: () => {
    const { selectedTopicsFuture, selectedTopicsPast, selectedTopics } = get();
    const next = selectedTopicsFuture[0];

    if (!next) {
      return;
    }

    set({
      selectedTopics: next,
      selectedTopicsPast: nextHistory(selectedTopicsPast, selectedTopics),
      selectedTopicsFuture: selectedTopicsFuture.slice(1),
      lastUpdatedAt: Date.now()
    });
  }
});
