'use client';

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT: z.url().optional()
});

const parsedEnv = envSchema.safeParse({
  NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT
});

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.issues.map((issue) => issue.path.join('.') + ' ' + issue.message).join(', ')}`);
}

export const env = parsedEnv.data;
