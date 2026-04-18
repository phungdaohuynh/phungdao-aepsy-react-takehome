import {
  RECORDING_HISTORY_MAX_ITEMS,
  RECORDING_HISTORY_MAX_TOTAL_BYTES,
  RECORDING_HISTORY_TTL_MS
} from '@/features/recording/constants/recording';
import type { RecordingHistoryItem } from '@/shared/state/types';

export function formatSizeMb(sizeBytes: number) {
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatShortDate(timestamp: number) {
  return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(
    new Date(timestamp)
  );
}

export function normalizeHistory(entries: RecordingHistoryItem[]) {
  const byKey = new Map(entries.map((entry) => [entry.audioStorageKey, entry]));
  return [...byKey.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function applyHistoryPolicy(entries: RecordingHistoryItem[], now: number) {
  const sorted = normalizeHistory(entries).filter((entry) => entry.expiresAt > now);
  const kept: RecordingHistoryItem[] = [];
  const removedKeys: string[] = [];

  let totalBytes = 0;
  for (const entry of sorted) {
    const exceedsSize = totalBytes + entry.sizeBytes > RECORDING_HISTORY_MAX_TOTAL_BYTES;
    const exceedsCount = kept.length >= RECORDING_HISTORY_MAX_ITEMS;

    if (exceedsSize || exceedsCount) {
      removedKeys.push(entry.audioStorageKey);
      continue;
    }

    kept.push(entry);
    totalBytes += entry.sizeBytes;
  }

  return { kept, removedKeys };
}

export function makeHistoryEntry(entry: Omit<RecordingHistoryItem, 'createdAt' | 'expiresAt'>, now: number): RecordingHistoryItem {
  return {
    ...entry,
    createdAt: now,
    expiresAt: now + RECORDING_HISTORY_TTL_MS
  };
}
