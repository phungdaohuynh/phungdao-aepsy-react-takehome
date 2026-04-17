'use client';

type AnalyticsEventName =
  | 'record_started'
  | 'record_stopped'
  | 'audio_uploaded'
  | 'topics_analyze_started'
  | 'topics_analyze_success'
  | 'topics_selected'
  | 'providers_loaded'
  | 'load_more_clicked';

type AnalyticsEvent = {
  name: AnalyticsEventName;
  at: string;
  payload?: Record<string, string | number | boolean>;
};

const STORAGE_KEY = 'aepsy-takehome-analytics-events';
const MAX_EVENTS = 200;

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
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
    const next = [...parsed, event].slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore analytics storage failures.
  }

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event);
  }
}
