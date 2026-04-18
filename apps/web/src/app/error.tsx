'use client';

import { useTranslation } from '@workspace/localization';
import { Alert, Box, UIButton, Container, Stack, Typography } from '@workspace/ui';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  void error;

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2.5}>
        <Typography variant="h4">{t('error.title')}</Typography>
        <Alert severity="error">{t('error.description')}</Alert>
        <Box>
          <UIButton onClick={reset}>{t('common.tryAgain')}</UIButton>
        </Box>
      </Stack>
    </Container>
  );
}
