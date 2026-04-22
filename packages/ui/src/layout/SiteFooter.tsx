'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

type UISiteFooterProps = {
  text: string;
};

export function UISiteFooter({ text }: UISiteFooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 0,
        height: { xs: 32, md: 34 },
        minHeight: { xs: 32, md: 34 },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center" noWrap>
          {text}
        </Typography>
      </Container>
    </Box>
  );
}

export type { UISiteFooterProps };
