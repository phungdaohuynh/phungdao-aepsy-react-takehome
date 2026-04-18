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

  return selectedTopics.slice(0, 2).map((topic) =>
    topic
      .replace(/^U_DIS_/, '')
      .replaceAll('_', ' ')
      .toLowerCase(),
  );
}

export type ProviderMatchScoreBreakdown = {
  topicMatchScore: number;
  experienceScore: number;
  profileCompletenessScore: number;
  totalScore: number;
};

export function getProviderMatchScore(
  provider: ProviderItem,
  selectedTopics: string[],
): ProviderMatchScoreBreakdown {
  const matchedTopicsCount = getProviderMatchReasons(provider, selectedTopics).length;
  const topicMatchScore = Math.min(
    60,
    matchedTopicsCount * 20 + (selectedTopics.length > 0 ? 10 : 0),
  );

  const years = provider.profile?.providerInfo?.yearExperience ?? 0;
  const experienceScore = Math.min(25, Math.round(years * 2.5));

  const hasAvatar = Boolean(provider.userInfo.avatar);
  const hasTags = (provider.profile?.providerTagInfo?.tags ?? []).length > 0;
  const hasTitle = Boolean(provider.profile?.providerInfo?.providerTitle);
  const profileCompletenessScore = (hasAvatar ? 5 : 0) + (hasTags ? 5 : 0) + (hasTitle ? 5 : 0);

  const totalScore = Math.min(100, topicMatchScore + experienceScore + profileCompletenessScore);

  return {
    topicMatchScore,
    experienceScore,
    profileCompletenessScore,
    totalScore,
  };
}
