export type AssignmentStep = 'record' | 'topics' | 'psychologists';
export type AudioSourceType = 'recorded' | 'uploaded';

export type AudioPayload = {
  audioDataUrl: string;
  audioStorageKey: string;
  audioMimeType: string;
  audioFileName: string;
  audioSourceType: AudioSourceType;
};

export type RecordingHistoryItem = {
  audioStorageKey: string;
  audioMimeType: string;
  audioFileName: string;
  audioSourceType: AudioSourceType;
  sizeBytes: number;
  createdAt: number;
  expiresAt: number;
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
  recordingHistory: RecordingHistoryItem[];
  setAudioPayload: (payload: AudioPayload) => void;
  setAudioDataUrl: (audioDataUrl: string | null) => void;
  setRecordingHistory: (entries: RecordingHistoryItem[]) => void;
  addRecordingHistoryEntry: (entry: RecordingHistoryItem) => void;
  removeRecordingHistoryEntry: (audioStorageKey: string) => void;
  clearRecordingHistory: () => void;
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
