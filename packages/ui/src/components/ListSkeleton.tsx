'use client';

import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

type UIListSkeletonProps = {
  rows?: number;
};

export function UIListSkeleton({ rows = 4 }: UIListSkeletonProps) {
  return (
    <Stack spacing={1.2}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={68} />
      ))}
    </Stack>
  );
}

export type { UIListSkeletonProps };
