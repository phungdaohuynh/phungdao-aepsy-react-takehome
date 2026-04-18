import { webConfig } from '@workspace/eslint-config/next';

export default [
  ...webConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', '../*'],
              message: 'Use alias imports (`@/`) instead of relative imports in apps/web/src.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/layout/*', '@/layout/**', '@/app/*', '@/app/**'],
              message: 'Feature modules must not depend on app/layout entry layers.',
            },
          ],
        },
      ],
    },
  },
];
