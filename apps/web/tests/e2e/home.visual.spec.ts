import { expect, test, type Page } from '@playwright/test';

type GraphqlRequest = {
  variables?: {
    pageNum?: number;
  };
};

async function mockGraphql(page: Page) {
  await page.route('https://api-dev.aepsy.com/graphql', async (route) => {
    const body = route.request().postDataJSON() as GraphqlRequest;
    const pageNum = body.variables?.pageNum ?? 1;

    const payload = {
      data: {
        searchProviders: {
          id: 'search-id',
          providers: {
            canLoadMore: pageNum === 1,
            totalSize: 2,
            providers: [
              {
                userInfo: { firebaseUid: 'provider-1', avatar: null },
                userName: { firstName: 'Maya', lastName: 'Keller' },
                profile: {
                  providerInfo: { yearExperience: 8, providerTitle: 'Clinical Psychologist' },
                  providerTagInfo: {
                    tags: [{ type: 'DISORDER', subType: 'ANXIETY', text: 'Stress' }]
                  }
                }
              },
              {
                userInfo: { firebaseUid: 'provider-2', avatar: null },
                userName: { firstName: 'Nora', lastName: 'Steiner' },
                profile: {
                  providerInfo: { yearExperience: 11, providerTitle: 'Psychologist' },
                  providerTagInfo: {
                    tags: [{ type: 'DISORDER', subType: 'PANIC', text: 'Sudden panic' }]
                  }
                }
              }
            ]
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

test.describe('visual snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await mockGraphql(page);
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
          caret-color: transparent !important;
        }
      `
    });
  });

  test('step 1 visual', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('step-shell-record')).toBeVisible();
    await expect(page).toHaveScreenshot('step-1-recording.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });

  test('step 3 visual', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('record-use-demo-audio-button').click();
    await page.getByTestId('record-continue-button').click();
    await page.getByTestId('topic-chip-U_DIS_STRESS').click();
    await page.getByTestId('topics-continue-button').click();

    await expect(page.getByTestId('step-shell-psychologists')).toBeVisible();
    await expect(page).toHaveScreenshot('step-3-psychologists.png', { fullPage: true, maxDiffPixelRatio: 0.02 });
  });
});
