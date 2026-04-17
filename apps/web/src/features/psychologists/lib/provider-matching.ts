import type { ProviderItem } from '@/features/psychologists/api/use-psychologists-query';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function getProviderMatchReasons(provider: ProviderItem, selectedTopics: string[]) {
  const normalizedTopics = new Set(selectedTopics.map(normalize));
  const tags = provider.profile?.providerTagInfo?.tags ?? [];

  const matches = tags
    .map((tag) => tag.text ?? tag.subType ?? '')
    .filter(Boolean)
    .filter((text) => normalizedTopics.has(normalize(text)));

  const uniqueMatches = [...new Set(matches)].slice(0, 3);

  if (uniqueMatches.length > 0) {
    return uniqueMatches;
  }

  return selectedTopics
    .slice(0, 2)
    .map((topic) => topic.replace(/^U_DIS_/, '').replaceAll('_', ' ').toLowerCase());
}
