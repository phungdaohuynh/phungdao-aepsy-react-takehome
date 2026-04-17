'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

type UISiteFooterProps = {
  text: string;
};

export function UISiteFooter({ text }: UISiteFooterProps) {
  return (
    <Box component="footer" sx={{ borderTop: '1px solid', borderColor: 'divider', mt: 4 }}>
      <Container maxWidth="lg" sx={{ py: 2.5 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {text}
        </Typography>
      </Container>
    </Box>
  );
}

export type { UISiteFooterProps };
