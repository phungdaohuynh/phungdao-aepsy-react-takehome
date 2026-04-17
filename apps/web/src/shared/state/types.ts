export type AssignmentStep = 'record' | 'topics' | 'psychologists';
export type AudioSourceType = 'recorded' | 'uploaded';

export type AudioPayload = {
  audioDataUrl: string;
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
  toggleTopic: (topic: string) => void;
  clearSelectedTopics: () => void;
};

export type AudioSlice = {
  audioDataUrl: string | null;
  audioMimeType: string | null;
  audioFileName: string | null;
  audioSourceType: AudioSourceType | null;
  setAudioPayload: (payload: AudioPayload) => void;
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
