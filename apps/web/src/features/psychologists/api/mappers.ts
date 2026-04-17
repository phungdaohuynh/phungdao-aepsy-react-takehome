import type {
  SearchProvidersNodeDto,
  SearchProvidersPage,
  SearchProvidersResponseDto
} from '@/features/psychologists/api/dto';

export function normalizeSearchProvidersNode(response: SearchProvidersResponseDto): SearchProvidersNodeDto | null {
  const node = response.searchProviders;

  if (Array.isArray(node)) {
    return node[0] ?? null;
  }

  return node ?? null;
}

export function mapSearchProvidersPage(node: SearchProvidersNodeDto | null, pageNum: number): SearchProvidersPage {
  if (!node) {
    return {
      items: [],
      canLoadMore: false,
      totalSize: 0,
      pageNum
    };
  }

  return {
    items: node.providers.providers,
    canLoadMore: node.providers.canLoadMore,
    totalSize: node.providers.totalSize,
    pageNum
  };
}
