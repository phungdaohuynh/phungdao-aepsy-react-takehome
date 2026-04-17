'use client';

import { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Chip, Divider, Stack, Typography, UIButton, UISectionCard } from '@workspace/ui';

type DevAnalyticsEvent = {
  name: string;
  at: string;
  payload?: Record<string, string | number | boolean>;
};

const STORAGE_KEY = 'aepsy-takehome-analytics-events';

export function AnalyticsDevDashboard() {
  const [events, setEvents] = useState<DevAnalyticsEvent[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? (JSON.parse(raw) as DevAnalyticsEvent[]) : [];
        setEvents(parsed);
      } catch {
        setEvents([]);
      }
    };

    load();
    window.addEventListener('storage', load);

    return () => {
      window.removeEventListener('storage', load);
    };
  }, []);

  const latestEvents = useMemo(() => [...events].reverse().slice(0, expanded ? 50 : 8), [events, expanded]);

  return (
    <UISectionCard title="Dev Analytics Dashboard" subheader="Client-side event stream for funnel debugging">
      <Stack spacing={1.5} data-testid="analytics-dev-dashboard">
        {events.length === 0 ? <Alert severity="info">No analytics events yet.</Alert> : null}

        {latestEvents.map((event, index) => (
          <Box key={`${event.at}-${event.name}-${index}`}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip size="small" color="secondary" label={event.name} />
              <Typography variant="caption" color="text.secondary">
                {new Date(event.at).toLocaleString('en')}
              </Typography>
            </Stack>
            {event.payload ? (
              <Typography variant="caption" component="pre" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(event.payload, null, 2)}
              </Typography>
            ) : null}
            <Divider sx={{ mt: 1 }} />
          </Box>
        ))}

        <Stack direction="row" spacing={1} useFlexGap>
          <UIButton variant="outlined" onClick={() => setExpanded((value) => !value)}>
            {expanded ? 'Show fewer events' : 'Show more events'}
          </UIButton>
          <UIButton
            variant="text"
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              setEvents([]);
            }}
          >
            Clear events
          </UIButton>
        </Stack>
      </Stack>
    </UISectionCard>
  );
}
