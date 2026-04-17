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
              { type: 'DISORDER', subType: 'SLEEP', text: 'Sleep problems' }
            ]
          }
        }
      },
      {
        userInfo: { firebaseUid: 'provider-2', avatar: null },
        userName: { firstName: 'Liam', lastName: 'Bucher' },
        profile: {
          providerInfo: { yearExperience: 5, providerTitle: 'Psychotherapist' },
          providerTagInfo: {
            tags: [{ type: 'DISORDER', subType: 'PANIC', text: 'Sudden panic' }]
          }
        }
      }
    ];

    const providersPage2 = [
      {
        userInfo: { firebaseUid: 'provider-3', avatar: null },
        userName: { firstName: 'Nora', lastName: 'Steiner' },
        profile: {
          providerInfo: { yearExperience: 11, providerTitle: 'Psychologist' },
          providerTagInfo: {
            tags: [{ type: 'DISORDER', subType: 'ANXIETY', text: 'Generalised anxiety' }]
          }
        }
      }
    ];

    const payload = {
      data: {
        searchProviders: {
          id: 'search-id',
          providers: {
            canLoadMore: pageNum === 1,
            totalSize: 3,
            providers: pageNum === 1 ? providersPage1 : providersPage2
          }
        }
      }
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload)
    });
  });
}

test('happy path: step 1 -> step 2 -> step 3 with load more', async ({ page }) => {
  await mockGraphql(page);
  await page.goto('/');
  await page.getByTestId('record-use-demo-audio-button').click();

  await expect(page.getByTestId('record-audio-player')).toBeVisible();
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
  await page.getByTestId('record-use-demo-audio-button').click();
  await page.getByTestId('record-continue-button').click();

  await expect(page.getByTestId('step-topics')).toBeVisible();
  await page.getByTestId('topic-chip-U_DIS_STRESS').click();
  await page.getByTestId('topics-continue-button').click();

  await expect(page.getByTestId('step-psychologists')).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('step-shell-psychologists')).toBeVisible();
  await expect(page.getByText('Step 3 - Psychologist Search')).toBeVisible();
});

test('upload audio file and restore draft banner', async ({ page }) => {
  await mockGraphql(page);
  await page.goto('/');
  await expect(page.getByTestId('step-recording')).toBeVisible();

  const uploadInput = page.getByTestId('record-upload-input');
  await expect(uploadInput).toBeAttached();

  await uploadInput.setInputFiles({
    name: 'voice-note.mp3',
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('fake-audio')
  });

  await expect(page.getByTestId('record-audio-player')).toBeVisible();
  await page.getByTestId('record-continue-button').click();
  await expect(page.getByTestId('step-topics')).toBeVisible();

  await page.reload();

  await expect(page.getByTestId('resume-draft-banner')).toBeVisible();
  await expect(page.getByTestId('step-shell-topics')).toBeVisible();
});
