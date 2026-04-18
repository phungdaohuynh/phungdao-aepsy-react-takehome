'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { createGraphQLClient } from '@workspace/api-client';

import type {
  SearchProvidersQueryParams,
  SearchProvidersResponseDto,
} from '@/features/psychologists/api/dto';
import {
  mapSearchProvidersPage,
  normalizeSearchProvidersNode,
} from '@/features/psychologists/api/mappers';
import { SEARCH_PROVIDERS } from '@/features/psychologists/api/queries';
export type { ProviderItem, SearchProvidersPage } from '@/features/psychologists/api/dto';

function withTimeoutAndAbort<T>(promise: Promise<T>, signal: AbortSignal, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Request aborted.'));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timed out after ${timeoutMs}ms.`));
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new Error('Request aborted.'));
    };

    signal.addEventListener('abort', onAbort, { once: true });

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        signal.removeEventListener('abort', onAbort);
        reject(error);
      });
  });
}

export function usePsychologistsQuery({
  rawDisorders,
  endpoint,
  pageSize = 8,
}: SearchProvidersQueryParams) {
  return useInfiniteQuery({
    queryKey: ['searchProviders', endpoint, rawDisorders, pageSize],
    initialPageParam: 1,
    enabled: rawDisorders.length > 0,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === 'Request aborted.') {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    queryFn: async ({ pageParam, signal }) => {
      const client = createGraphQLClient(endpoint);
      const requestPromise = client.request<SearchProvidersResponseDto>(SEARCH_PROVIDERS, {
        pageNum: pageParam,
        pageSize,
        rawDisorders,
      });
      const response = await withTimeoutAndAbort(requestPromise, signal, 10_000);

      const node = normalizeSearchProvidersNode(response);
      return mapSearchProvidersPage(node, pageParam);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.canLoadMore) {
        return undefined;
      }

      return lastPage.pageNum + 1;
    },
  });
}
