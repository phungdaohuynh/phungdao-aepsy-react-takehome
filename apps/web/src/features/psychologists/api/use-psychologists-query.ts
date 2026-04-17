'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { createGraphQLClient } from '@workspace/api-client';

import type { SearchProvidersQueryParams, SearchProvidersResponseDto } from './dto';
import { mapSearchProvidersPage, normalizeSearchProvidersNode } from './mappers';
import { SEARCH_PROVIDERS } from './queries';
export type { ProviderItem, SearchProvidersPage } from './dto';

export function usePsychologistsQuery({ rawDisorders, endpoint, pageSize = 8 }: SearchProvidersQueryParams) {
  const client = createGraphQLClient(endpoint);

  return useInfiniteQuery({
    queryKey: ['searchProviders', endpoint, rawDisorders, pageSize],
    initialPageParam: 1,
    enabled: rawDisorders.length > 0,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    queryFn: async ({ pageParam }) => {
      const response = await client.request<SearchProvidersResponseDto>(SEARCH_PROVIDERS, {
        pageNum: pageParam,
        pageSize,
        rawDisorders
      });

      const node = normalizeSearchProvidersNode(response);
      return mapSearchProvidersPage(node, pageParam);
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.canLoadMore) {
        return undefined;
      }

      return lastPage.pageNum + 1;
    }
  });
}
