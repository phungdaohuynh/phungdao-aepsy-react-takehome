import { expect, test, type Page } from '@playwright/test';

type GraphqlProvider = {
  userInfo: { firebaseUid: string; avatar: string | null };
  userName: { firstName: string; lastName: string };
  profile: {
    providerInfo: { yearExperience: number; providerTitle: string };
    providerTagInfo: {
      tags: Array<{ type: string; subType: string; text: string }>;
    };
  };
};

type GraphqlRoutePayload = {
  canLoadMore?: boolean;
  totalSize?: number;
  providers?: GraphqlProvider[];
  fail?: boolean;
};

type PersistedState = {
  step: 'record' | 'topics' | 'psychologists';
  selectedTopics?: string[];
  audioDataUrl?: string | null;
  audioStorageKey?: string | null;
  audioMimeType?: string | null;
  audioFileName?: string | null;
  audioSourceType?: 'recorded' | 'uploaded' | null;
  lastUpdatedAt?: number | null;
  hasRecordingConsent?: boolean;
};

async function mockGraphql(page: Page, payload: GraphqlRoutePayload = {}) {
  await page.route('https://api-dev.aepsy.com/graphql', async (route) => {
    if (payload.fail) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ message: 'Internal error' }] }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          searchProviders: {
            id: 'search-id',
            providers: {
              canLoadMore: payload.canLoadMore ?? false,
              totalSize: payload.totalSize ?? (payload.providers?.length ?? 0),
              providers: payload.providers ?? [],
            },
          },
        },
      }),
    });
  });
}

async function seedPersistedState(page: Page, state: PersistedState) {
  await page.addInitScript((nextState: PersistedState) => {
    const persisted = {
      state: {
        step: nextState.step,
        selectedTopics: nextState.selectedTopics ?? [],
        selectedTopicsPast: [],
        selectedTopicsFuture: [],
        audioDataUrl: nextState.audioDataUrl ?? null,
        audioStorageKey: nextState.audioStorageKey ?? null,
        audioMimeType: nextState.audioMimeType ?? null,
        audioFileName: nextState.audioFileName ?? null,
        audioSourceType: nextState.audioSourceType ?? null,
        lastUpdatedAt: nextState.lastUpdatedAt ?? Date.now(),
        hasHydrated: true,
        hasRecordingConsent: nextState.hasRecordingConsent ?? false,
      },
      version: 0,
    };

    localStorage.setItem('aepsy-takehome-progress', JSON.stringify(persisted));
  }, state);
}

async function attachAudioFile(page: Page) {
  await page.getByTestId('record-upload-input').setInputFiles({
    name: 'voice-note.mp3',
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('fake-audio'),
  });
}

test('recording actions are enabled by default', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('record-start-button')).toBeEnabled();
  await expect(page.getByTestId('record-upload-button')).toBeEnabled();
});

test('upload validation shows an error for non-audio files', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('record-upload-input').setInputFiles({
    name: 'not-audio.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  });

  await expect(page.getByText('Please upload a valid audio file.')).toBeVisible();
  await expect(page.getByTestId('record-continue-button')).toBeDisabled();
});

test('step guard sends users back to record when no audio exists', async ({ page }) => {
  await seedPersistedState(page, {
    step: 'psychologists',
    selectedTopics: ['U_DIS_STRESS'],
    audioDataUrl: null,
    audioStorageKey: null,
  });

  await page.goto('/');

  await expect(page.getByTestId('step-shell-record')).toBeVisible();
});

test('step guard sends users to topics when topics are missing on step 3', async ({ page }) => {
  await seedPersistedState(page, {
    step: 'psychologists',
    selectedTopics: [],
    audioDataUrl: 'data:audio/webm;base64,ZmFrZS1hdWRpbw==',
    audioStorageKey: null,
    audioMimeType: 'audio/webm',
    audioFileName: 'seeded.webm',
    audioSourceType: 'uploaded',
  });

  await page.goto('/');

  await expect(page.getByTestId('step-shell-topics')).toBeVisible();
});

test('topics supports quick pick, undo, and redo', async ({ page }) => {
  await page.goto('/');
  await attachAudioFile(page);
  await page.getByTestId('record-continue-button').click();

  await expect(page.getByTestId('step-topics')).toBeVisible();
  await expect(page.getByTestId('topics-analyze-button')).toBeEnabled();

  await expect(page.getByText('Select one or more topics (0 selected)')).toBeVisible();
  await page.getByRole('button', { name: 'Quick pick top 3' }).click();
  await expect(page.getByText('Select one or more topics (3 selected)')).toBeVisible();

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('Select one or more topics (0 selected)')).toBeVisible();

  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByText('Select one or more topics (3 selected)')).toBeVisible();
  await expect(page.getByTestId('topics-continue-button')).toBeEnabled();
});

test('step 3 shows empty state and no load-more button when API returns no providers', async ({
  page,
}) => {
  await mockGraphql(page, { providers: [], canLoadMore: false, totalSize: 0 });

  await page.goto('/');
  await attachAudioFile(page);
  await page.getByTestId('record-continue-button').click();
  await page.getByTestId('topic-chip-U_DIS_STRESS').click();
  await page.getByTestId('topics-continue-button').click();

  await expect(page.getByTestId('step-psychologists')).toBeVisible();
  await expect(page.getByText('No psychologists found')).toBeVisible();
  await expect(page.getByTestId('psychologists-load-more-button')).toBeHidden();
});

test('step 3 surfaces GraphQL errors', async ({ page }) => {
  await mockGraphql(page, { fail: true });

  await page.goto('/');
  await attachAudioFile(page);
  await page.getByTestId('record-continue-button').click();
  await page.getByTestId('topic-chip-U_DIS_STRESS').click();
  await page.getByTestId('topics-continue-button').click();

  await expect(page.getByTestId('step-psychologists')).toBeVisible();
  await expect(
    page.getByText(
      'Failed to load psychologists. Please verify the GraphQL endpoint and selected topics.',
    ),
  ).toBeVisible();
});

test('load-more button is hidden when first page has no next page', async ({ page }) => {
  await mockGraphql(page, {
    canLoadMore: false,
    totalSize: 1,
    providers: [
      {
        userInfo: { firebaseUid: 'provider-1', avatar: null },
        userName: { firstName: 'Maya', lastName: 'Keller' },
        profile: {
          providerInfo: { yearExperience: 8, providerTitle: 'Clinical Psychologist' },
          providerTagInfo: {
            tags: [{ type: 'DISORDER', subType: 'ANXIETY', text: 'Stress' }],
          },
        },
      },
    ],
  });

  await page.goto('/');
  await attachAudioFile(page);
  await page.getByTestId('record-continue-button').click();
  await page.getByTestId('topic-chip-U_DIS_STRESS').click();
  await page.getByTestId('topics-continue-button').click();

  await expect(page.getByText('Maya Keller')).toBeVisible();
  await expect(page.getByTestId('psychologists-load-more-button')).toBeHidden();
});
