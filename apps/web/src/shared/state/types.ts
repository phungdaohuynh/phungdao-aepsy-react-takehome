export type AssignmentStep = 'record' | 'topics' | 'psychologists';
export type AudioSourceType = 'recorded' | 'uploaded';

export type AudioPayload = {
  audioDataUrl: string;
  audioStorageKey: string;
  audioMimeType: string;
  audioFileName: string;
  audioSourceType: AudioSourceType;
};

export type NavigationSlice = {
  step: AssignmentStep;
  setStep: (step: AssignmentStep) => void;
};

export type TopicsSlice = {
  selectedTopics: string[];
  selectedTopicsPast: string[][];
  selectedTopicsFuture: string[][];
  toggleTopic: (topic: string) => void;
  setSelectedTopics: (topics: string[]) => void;
  clearSelectedTopics: () => void;
  undoTopicSelection: () => void;
  redoTopicSelection: () => void;
};

export type AudioSlice = {
  audioDataUrl: string | null;
  audioStorageKey: string | null;
  audioMimeType: string | null;
  audioFileName: string | null;
  audioSourceType: AudioSourceType | null;
  setAudioPayload: (payload: AudioPayload) => void;
  setAudioDataUrl: (audioDataUrl: string | null) => void;
  clearAudioPayload: () => void;
};

export type MetaSlice = {
  lastUpdatedAt: number | null;
  hasHydrated: boolean;
  markHydrated: (value: boolean) => void;
};

export type AppState = NavigationSlice &
  TopicsSlice &
  AudioSlice &
  MetaSlice & {
    reset: () => void;
  };
