'use client';

type PublicEnv = {
  NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT?: string;
};

const endpoint = process.env.NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT;
const normalizedEndpoint = typeof endpoint === 'string' && endpoint.trim().length > 0 ? endpoint : null;

export const env: PublicEnv = normalizedEndpoint
  ? {
      NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT: normalizedEndpoint,
    }
  : {};
