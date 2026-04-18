'use client';

import { ANALYTICS_MAX_EVENTS, ANALYTICS_STORAGE_KEY } from '@/shared/constants/analytics';

type AnalyticsEventName =
  | 'record_started'
  | 'record_stopped'
  | 'audio_uploaded'
  | 'audio_deleted'
  | 'topics_analyze_started'
  | 'topics_analyze_success'
  | 'topics_selected'
  | 'topics_undo'
  | 'topics_redo'
  | 'providers_loaded'
  | 'providers_filtered'
  | 'providers_sorted'
  | 'provider_compared'
  | 'history_restored'
  | 'history_cleared'
  | 'load_more_clicked';

type AnalyticsEvent = {
  name: AnalyticsEventName;
  at: string;
  payload?: Record<string, string | number | boolean>;
};

export function trackEvent(name: AnalyticsEventName, payload?: AnalyticsEvent['payload']) {
  if (typeof window === 'undefined') {
    return;
  }

  const event: AnalyticsEvent = {
    name,
    at: new Date().toISOString(),
    ...(payload ? { payload } : {})
  };

  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    const next = [...parsed, event].slice(-ANALYTICS_MAX_EVENTS);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore analytics storage failures.
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event);
  }
}
