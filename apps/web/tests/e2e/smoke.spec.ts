import { expect, type Page, test } from '@playwright/test';

type GraphqlRequest = {
  operationName?: string;
  query?: string;
  variables?: {
    pageNum?: number;
    pageSize?: number;
    rawDisorders?: string[];
  };
};

async function mockGraphql(page: Page) {
  await page.route('https://api-dev.aepsy.com/graphql', async (route) => {
    const body = route.request().postDataJSON() as GraphqlRequest;
    const pageNum = body.variables?.pageNum ?? 1;

    const providersPage1 = [
      {
        userInfo: { firebaseUid: 'provider-1', avatar: null },
        userName: { firstName: 'Maya', lastName: 'Keller' },
        profile: {
          providerInfo: { yearExperience: 8, providerTitle: 'Clinical Psychologist' },
          providerTagInfo: {
            tags: [
              { type: 'DISORDER', subType: 'ANXIETY', text: 'Stress' },
              { type: 'DISORDER', subType: 'SLEEP', text: 'Sleep problems' },
            ],
          },
        },
      },
      {
        userInfo: { firebaseUid: 'provider-2', avatar: null },
        userName: { firstName: 'Liam', lastName: 'Bucher' },
        profile: {
          providerInfo: { yearExperience: 5, providerTitle: 'Psychotherapist' },
          providerTagInfo: {
            tags: [{ type: 'DISORDER', subType: 'PANIC', text: 'Sudden panic' }],
          },
        },
      },
    ];

    const providersPage2 = [
      {
        userInfo: { firebaseUid: 'provider-3', avatar: null },
        userName: { firstName: 'Nora', lastName: 'Steiner' },
        profile: {
          providerInfo: { yearExperience: 11, providerTitle: 'Psychologist' },
          providerTagInfo: {
            tags: [{ type: 'DISORDER', subType: 'ANXIETY', text: 'Generalised anxiety' }],
          },
        },
      },
    ];

    const payload = {
      data: {
        searchProviders: {
          id: 'search-id',
          providers: {
            canLoadMore: pageNum === 1,
            totalSize: 3,
            providers: pageNum === 1 ? providersPage1 : providersPage2,
          },
        },
      },
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

async function mockRecordingApis(page: Page) {
  await page.addInitScript(() => {
    class FakeMediaRecorder extends EventTarget {
      public state: 'inactive' | 'recording' | 'paused' = 'inactive';
      public mimeType = 'audio/webm';

      start() {
        this.state = 'recording';
      }

      pause() {
        this.state = 'paused';
        this.dispatchEvent(new Event('pause'));
      }

      resume() {
        this.state = 'recording';
        this.dispatchEvent(new Event('resume'));
      }

      stop() {
        this.state = 'inactive';
        this.dispatchEvent(new Event('stop'));
      }
    }

    const getUserMedia = async () =>
      ({
        getTracks: () => [
          {
            stop: () => {},
          },
        ],
      }) as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });

    Object.defineProperty(window, 'MediaRecorder', {
      value: FakeMediaRecorder,
      configurable: true,
    });
  });
}

async function attachAudioFile(page: Page) {
  await page.getByTestId('record-upload-input').setInputFiles({
    name: 'voice-note.mp3',
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('fake-audio'),
  });
}

test('happy path: step 1 -> step 2 -> step 3 with load more', async ({ page }) => {
  await mockGraphql(page);
  await page.goto('/');
  await attachAudioFile(page);

  await expect(page.getByTestId('record-continue-button')).toBeEnabled();
  await page.getByTestId('record-continue-button').click();

  await expect(page.getByTestId('step-topics')).toBeVisible();

  await page.getByTestId('topic-chip-U_DIS_STRESS').click();
  await page.getByTestId('topics-continue-button').click();

  await expect(page.getByTestId('step-psychologists')).toBeVisible();
  await expect(page.getByText('Maya Keller')).toBeVisible();

  await page.getByTestId('psychologists-load-more-button').click();
  await expect(page.getByText('Nora Steiner')).toBeVisible();
});

test('refresh keeps progress on step 3', async ({ page }) => {
  await mockGraphql(page);
  await page.goto('/');
  await attachAudioFile(page);
  await page.getByTestId('record-continue-button').click();

  await expect(page.getByTestId('step-topics')).toBeVisible();
  await page.getByTestId('topic-chip-U_DIS_STRESS').click();
  await page.getByTestId('topics-continue-button').click();

  await expect(page.getByTestId('step-psychologists')).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('step-shell-psychologists')).toBeVisible();
  await expect(page.getByText('Step 3 - Psychologist Search')).toBeVisible();
});

test('upload audio file and restore step after refresh', async ({ page }) => {
  await mockGraphql(page);
  await page.goto('/');
  await expect(page.getByTestId('step-recording')).toBeVisible();
  await attachAudioFile(page);

  await expect(page.getByTestId('record-continue-button')).toBeEnabled();
  await page.getByTestId('record-continue-button').click();
  await expect(page.getByTestId('step-topics')).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('step-shell-topics')).toBeVisible();
});

test('refresh during recording shows interruption warning and keeps app stable', async ({
  page,
}) => {
  await mockGraphql(page);
  await mockRecordingApis(page);
  await page.goto('/');

  await page.getByTestId('record-start-button').click();
  await page.reload();

  await expect(
    page.getByText('Recording was interrupted. Please review and record again if needed.'),
  ).toBeVisible();
  await expect(page.getByTestId('step-recording')).toBeVisible();
});

test('supports pause and resume while recording', async ({ page }) => {
  await mockGraphql(page);
  await mockRecordingApis(page);
  await page.goto('/');

  await page.getByTestId('record-start-button').click();
  await expect(page.getByTestId('record-pause-button')).toBeVisible();

  await page.getByTestId('record-pause-button').click();
  await expect(page.getByTestId('record-resume-button')).toBeVisible();

  await page.getByTestId('record-resume-button').click();
  await expect(page.getByTestId('record-pause-button')).toBeVisible();
});

test('indexeddb unavailable shows storage error without crashing', async ({ page }) => {
  await mockGraphql(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');

  await page.getByTestId('record-upload-input').setInputFiles({
    name: 'voice-note.mp3',
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('fake-audio'),
  });

  await expect(
    page.getByText('Local audio storage is unavailable in this environment.').first(),
  ).toBeVisible();
  await expect(page.getByTestId('step-recording')).toBeVisible();
});

test('compare panel supports close, reopen, and remove item', async ({ page }) => {
  await mockGraphql(page);
  await page.goto('/');
  await attachAudioFile(page);
  await page.getByTestId('record-continue-button').click();

  await expect(page.getByTestId('step-topics')).toBeVisible();
  await page.getByTestId('topic-chip-U_DIS_STRESS').click();
  await page.getByTestId('topics-continue-button').click();

  await expect(page.getByTestId('step-psychologists')).toBeVisible();
  await page.getByTestId('provider-card-provider-1').getByRole('button', { name: 'Compare' }).click();

  await expect(page.getByText('Compare psychologists')).toBeVisible();
  await page.getByTestId('psychologists-compare-panel').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByText('Compare psychologists')).not.toBeVisible();

  await page.getByTestId('psychologists-compare-floating-button').click();
  await expect(page.getByText('Compare psychologists')).toBeVisible();

  await page.getByTestId('psychologists-compare-remove-provider-1').click();
  await expect(page.getByText('Compare psychologists')).not.toBeVisible();
  await expect(page.getByTestId('psychologists-compare-floating-button')).not.toBeVisible();
});
