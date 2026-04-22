'use client';

import { useTranslation } from '@workspace/localization';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  UIButton,
  UIEmptyState,
  UILoadingState,
  UIListSkeleton,
  UISectionCard,
  useUIToast,
} from '@workspace/ui';

import { usePsychologistsQuery } from '@/features/psychologists/api/use-psychologists-query';
import type { ProviderItem } from '@/features/psychologists/api/dto';
import { DEFAULT_GRAPHQL_ENDPOINT } from '@/features/psychologists/constants/search';
import {
  getProviderMatchReasons,
  getProviderMatchScore,
} from '@/features/psychologists/lib/provider-matching';
import { formatExperienceLabel } from '@/features/psychologists/lib/format-experience-label';
import { getProviderFullName } from '@/features/psychologists/lib/provider-name';
import { env } from '@/shared/config/env';
import { trackEvent } from '@/shared/lib/analytics';
import { useAppStore } from '@/shared/state/store';

export function StepPsychologists() {
  const { t } = useTranslation();
  const toast = useUIToast();
  const selectedTopics = useAppStore((state) => state.selectedTopics);
  const setStep = useAppStore((state) => state.setStep);
  const [sortBy, setSortBy] = useState<'best_match' | 'experience_desc' | 'name_asc'>('best_match');
  const [minExperienceFilter, setMinExperienceFilter] = useState<number>(0);
  const [nameQuery, setNameQuery] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareVisible, setCompareVisible] = useState(true);

  const endpoint = env.NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT ?? DEFAULT_GRAPHQL_ENDPOINT;

  const query = usePsychologistsQuery({
    rawDisorders: selectedTopics,
    endpoint,
    pageSize: 8,
  });

  const providers = (query.data?.pages ?? []).reduce<ProviderItem[]>(
    (accumulator, page) => accumulator.concat(page.items),
    [],
  );

  const uniqueProviders = providers.filter((provider, index) => {
    return (
      providers.findIndex((item) => item.userInfo.firebaseUid === provider.userInfo.firebaseUid) ===
      index
    );
  });

  const enrichedProviders = useMemo(
    () =>
      uniqueProviders.map((provider) => ({
        provider,
        reasons: getProviderMatchReasons(provider, selectedTopics),
        score: getProviderMatchScore(provider, selectedTopics),
      })),
    [selectedTopics, uniqueProviders],
  );

  const filteredProviders = useMemo(() => {
    const normalizedQuery = nameQuery.trim().toLowerCase();

    const filtered = enrichedProviders.filter((item) => {
      const fullName = getProviderFullName(
        item.provider.userName.firstName,
        item.provider.userName.lastName,
      ).toLowerCase();
      const years = item.provider.profile?.providerInfo?.yearExperience ?? 0;
      const matchesName = normalizedQuery.length === 0 || fullName.includes(normalizedQuery);
      const matchesExperience = years >= minExperienceFilter;

      return matchesName && matchesExperience;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'experience_desc') {
        return (
          (b.provider.profile?.providerInfo?.yearExperience ?? 0) -
          (a.provider.profile?.providerInfo?.yearExperience ?? 0)
        );
      }

      if (sortBy === 'name_asc') {
        const nameA = getProviderFullName(
          a.provider.userName.firstName,
          a.provider.userName.lastName,
        );
        const nameB = getProviderFullName(
          b.provider.userName.firstName,
          b.provider.userName.lastName,
        );
        return nameA.localeCompare(nameB);
      }

      return b.score.totalScore - a.score.totalScore;
    });
  }, [enrichedProviders, minExperienceFilter, nameQuery, sortBy]);

  const compareProviders = useMemo(
    () =>
      compareIds
        .map((id) => enrichedProviders.find((item) => item.provider.userInfo.firebaseUid === id))
        .filter((item): item is (typeof enrichedProviders)[number] => Boolean(item)),
    [compareIds, enrichedProviders],
  );

  const totalSize = query.data?.pages[0]?.totalSize ?? 0;

  useEffect(() => {
    if (query.isSuccess && filteredProviders.length > 0) {
      trackEvent('providers_loaded', {
        providers: filteredProviders.length,
        topics: selectedTopics.length,
      });
    }
  }, [filteredProviders.length, query.isSuccess, selectedTopics.length]);

  useEffect(() => {
    trackEvent('providers_filtered', { minExperienceFilter, query: nameQuery.length > 0 });
  }, [minExperienceFilter, nameQuery]);

  useEffect(() => {
    trackEvent('providers_sorted', { sortBy });
  }, [sortBy]);

  if (selectedTopics.length === 0) {
    return (
      <Alert
        severity="warning"
        action={
          <UIButton variant="text" onClick={() => setStep('topics')}>
            {t('psychologists.actions.backToStep2')}
          </UIButton>
        }
      >
        {t('errors.requireTopicBeforeSearch')}
      </Alert>
    );
  }

  return (
    <UISectionCard
      title={t('psychologists.title')}
      subheader={t('psychologists.subheader', { count: selectedTopics.length })}
    >
      <Stack spacing={2} data-testid="step-psychologists">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <UIButton variant="outlined" onClick={() => setStep('topics')}>
            {t('psychologists.actions.backToStep2')}
          </UIButton>
          <Tooltip
            title={
              compareIds.length === 0
                ? t('psychologists.tooltips.selectForCompare')
                : t('psychologists.tooltips.openCompare')
            }
          >
            <span>
              <UIButton
                variant="outlined"
                disabled={compareIds.length === 0}
                onClick={() => setCompareVisible(true)}
              >
                {t('psychologists.actions.compareSelected', { count: compareIds.length })}
              </UIButton>
            </span>
          </Tooltip>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            fullWidth
            size="small"
            value={nameQuery}
            onChange={(event) => setNameQuery(event.target.value)}
            placeholder={t('psychologists.filters.searchByName')}
          />
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="sort-by-label">{t('psychologists.filters.sortBy')}</InputLabel>
            <Select
              labelId="sort-by-label"
              label={t('psychologists.filters.sortBy')}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
            >
              <MenuItem value="best_match">{t('psychologists.filters.sortBestMatch')}</MenuItem>
              <MenuItem value="experience_desc">
                {t('psychologists.filters.sortExperience')}
              </MenuItem>
              <MenuItem value="name_asc">{t('psychologists.filters.sortName')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="exp-filter-label">
              {t('psychologists.filters.minExperience')}
            </InputLabel>
            <Select
              labelId="exp-filter-label"
              label={t('psychologists.filters.minExperience')}
              value={String(minExperienceFilter)}
              onChange={(event) => setMinExperienceFilter(Number(event.target.value))}
            >
              <MenuItem value="0">{t('psychologists.filters.anyExperience')}</MenuItem>
              <MenuItem value="3">{t('psychologists.filters.experience3')}</MenuItem>
              <MenuItem value="5">{t('psychologists.filters.experience5')}</MenuItem>
              <MenuItem value="10">{t('psychologists.filters.experience10')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {query.isLoading ? (
          <>
            <UILoadingState label={t('psychologists.loading')} />
            <UIListSkeleton rows={4} />
          </>
        ) : null}

        {query.error ? <Alert severity="error">{t('psychologists.error')}</Alert> : null}

        {!query.isLoading && !query.error && filteredProviders.length === 0 ? (
          <UIEmptyState
            title={t('psychologists.emptyTitle')}
            description={t('psychologists.emptyDescriptionAdvanced')}
            action={
              <UIButton variant="text" onClick={() => void query.refetch()}>
                {t('common.retry')}
              </UIButton>
            }
          />
        ) : null}

        {filteredProviders.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('psychologists.showingCount', {
                shown: filteredProviders.length,
                total: totalSize,
              })}
            </Typography>

            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {filteredProviders.map(({ provider, reasons, score }, index) => {
                const fullName = getProviderFullName(
                  provider.userName.firstName,
                  provider.userName.lastName,
                );
                const providerTitle =
                  provider.profile?.providerInfo?.providerTitle ??
                  t('psychologists.defaultProviderTitle');
                const yearExperience = provider.profile?.providerInfo?.yearExperience;
                const experienceLabel =
                  typeof yearExperience === 'number'
                    ? formatExperienceLabel(yearExperience)
                    : null;
                const tags = provider.profile?.providerTagInfo?.tags ?? [];
                const isCompared = compareIds.includes(provider.userInfo.firebaseUid);

                return (
                  <Box
                    key={provider.userInfo.firebaseUid}
                    data-testid={`provider-card-${provider.userInfo.firebaseUid}`}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                      <Avatar
                        src={provider.userInfo.avatar ?? undefined}
                        alt={fullName || t('psychologists.unknownProvider')}
                      />

                      <Stack spacing={0.8} sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {fullName || t('psychologists.unknownProvider')}
                          </Typography>
                          <Chip
                            size="small"
                            color="secondary"
                            variant="outlined"
                            label={t('psychologists.rank', { rank: index + 1 })}
                          />
                          <Chip
                            size="small"
                            color="success"
                            label={t('psychologists.matchScore', { score: score.totalScore })}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {providerTitle}
                          {experienceLabel ? ` • ${experienceLabel}` : ''}
                        </Typography>

                        <Stack direction="row" spacing={0.8} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {tags.slice(0, 6).map((tag, itemIndex) => (
                            <Chip
                              key={`${provider.userInfo.firebaseUid}-${tag.text ?? 'tag'}-${itemIndex}`}
                              size="small"
                              label={tag.text ?? tag.subType ?? t('psychologists.tagFallback')}
                              variant="outlined"
                            />
                          ))}
                        </Stack>

                        <Stack direction="row" spacing={0.8} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          {reasons.map((reason, reasonIndex) => (
                            <Chip
                              key={`${provider.userInfo.firebaseUid}-reason-${reasonIndex}`}
                              size="small"
                              color="primary"
                              label={t('psychologists.whyMatched', { reason })}
                            />
                          ))}
                        </Stack>

                        <Stack direction="row" spacing={0.8} useFlexGap sx={{ flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={t('psychologists.scoreBreakdown.topics', {
                              score: score.topicMatchScore,
                            })}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={t('psychologists.scoreBreakdown.experience', {
                              score: score.experienceScore,
                            })}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={t('psychologists.scoreBreakdown.profile', {
                              score: score.profileCompletenessScore,
                            })}
                          />
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          <Tooltip
                            title={
                              isCompared
                                ? t('psychologists.tooltips.removeFromCompare')
                                : t('psychologists.tooltips.addToCompare')
                            }
                          >
                            <span>
                              <UIButton
                                size="small"
                                variant={isCompared ? 'contained' : 'outlined'}
                                onClick={() => {
                                  if (isCompared) {
                                    setCompareIds((current) =>
                                      current.filter((item) => item !== provider.userInfo.firebaseUid),
                                    );
                                    trackEvent('provider_compared', {
                                      provider: provider.userInfo.firebaseUid,
                                      action: 'removed',
                                    });
                                    return;
                                  }

                                  if (compareIds.length >= 3) {
                                    toast.showInfo(t('psychologists.toast.maxCompare'));
                                    return;
                                  }

                                  setCompareIds((current) => [
                                    ...current,
                                    provider.userInfo.firebaseUid,
                                  ]);
                                  setCompareVisible(true);
                                  trackEvent('provider_compared', {
                                    provider: provider.userInfo.firebaseUid,
                                    action: 'added',
                                  });
                                }}
                              >
                                {isCompared
                                  ? t('psychologists.actions.compared')
                                  : t('psychologists.actions.compare')}
                              </UIButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={t('psychologists.tooltips.requestSession')}>
                            <span>
                              <UIButton
                                size="small"
                                variant="text"
                                onClick={() => {
                                  toast.showSuccess(t('psychologists.toast.bookingMock'));
                                }}
                              >
                                {t('psychologists.actions.requestSession')}
                              </UIButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            {query.hasNextPage ? (
              <Box
                sx={{
                  position: { xs: 'sticky', md: 'static' },
                  bottom: { xs: 12, md: 'auto' },
                  zIndex: 5,
                }}
              >
                <Tooltip title={t('psychologists.tooltips.loadMore')}>
                  <span>
                    <UIButton
                      onClick={() => {
                        trackEvent('load_more_clicked', { shown: uniqueProviders.length });
                        trackEvent('providers_filtered', { sortBy, minExperienceFilter });
                        void query.fetchNextPage();
                      }}
                      disabled={query.isFetchingNextPage}
                      data-testid="psychologists-load-more-button"
                    >
                      {query.isFetchingNextPage ? t('common.loadingMore') : t('common.loadMore')}
                    </UIButton>
                  </span>
                </Tooltip>
              </Box>
            ) : null}
          </>
        ) : null}
      </Stack>

      {compareIds.length > 0 && !isCompareVisible ? (
        <Box
          sx={{
            position: 'fixed',
            right: 16,
            top: 88,
            zIndex: 1200,
          }}
        >
          <UIButton
            variant="contained"
            data-testid="psychologists-compare-floating-button"
            onClick={() => setCompareVisible(true)}
          >
            {t('psychologists.actions.compareSelected', { count: compareIds.length })}
          </UIButton>
        </Box>
      ) : null}

      {compareIds.length > 0 && isCompareVisible ? (
        <>
          <Box
            data-testid="psychologists-compare-backdrop"
            onClick={() => setCompareVisible(false)}
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: 1199,
              bgcolor: 'transparent',
            }}
          />
          <Box
            data-testid="psychologists-compare-panel"
            sx={{
              position: 'fixed',
              left: { xs: 8, md: 24 },
              right: { xs: 8, md: 24 },
              bottom: { xs: 8, md: 16 },
              zIndex: 1200,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: 8,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: { xs: '55vh', md: '50vh' },
              overflow: 'hidden',
            }}
          >
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              flexShrink: 0,
            }}
          >
            <Box sx={{ minWidth: 0, pr: 1 }}>
              <Typography variant="h6">{t('psychologists.compare.title')}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('psychologists.compare.description')}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
              <UIButton variant="outlined" size="small" onClick={() => setCompareVisible(false)}>
                {t('psychologists.compare.close')}
              </UIButton>
              <UIButton
                variant="text"
                size="small"
                onClick={() => {
                  setCompareIds([]);
                  setCompareVisible(false);
                }}
              >
                {t('psychologists.compare.clear')}
              </UIButton>
            </Stack>
          </Stack>

          <Box sx={{ p: 1.5, overflow: 'auto', minHeight: 0 }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.25}
              sx={{ minWidth: { xs: 'auto', md: 920 } }}
            >
              {compareProviders.map(({ provider, score, reasons }) => {
                const name =
                  getProviderFullName(provider.userName.firstName, provider.userName.lastName) ||
                  t('psychologists.unknownProvider');
                const title =
                  provider.profile?.providerInfo?.providerTitle ??
                  t('psychologists.defaultProviderTitle');
                const years = provider.profile?.providerInfo?.yearExperience ?? 0;
                const experienceLabel = formatExperienceLabel(years);
                const tags = provider.profile?.providerTagInfo?.tags ?? [];

                return (
                  <Box
                    key={`compare-${provider.userInfo.firebaseUid}`}
                    sx={{
                      minWidth: { xs: 'auto', md: 280 },
                      flex: 1,
                      p: 1.25,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                      <Avatar
                        src={provider.userInfo.avatar ?? undefined}
                        alt={name}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
                          {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {title}
                        </Typography>
                      </Box>
                      <UIButton
                        size="small"
                        color="error"
                        variant="text"
                        data-testid={`psychologists-compare-remove-${provider.userInfo.firebaseUid}`}
                        onClick={() => {
                          setCompareIds((current) =>
                            current.filter((id) => id !== provider.userInfo.firebaseUid),
                          );
                        }}
                      >
                        {t('psychologists.compare.remove')}
                      </UIButton>
                    </Stack>

                    <Stack spacing={0.75}>
                      <Typography variant="caption" color="text.secondary">
                        {experienceLabel}
                      </Typography>
                      <Typography variant="caption">
                        {t('psychologists.matchScore', { score: score.totalScore })}
                      </Typography>
                      <Typography variant="caption">
                        {t('psychologists.scoreBreakdown.topics', { score: score.topicMatchScore })}
                      </Typography>
                      <Typography variant="caption">
                        {t('psychologists.scoreBreakdown.experience', { score: score.experienceScore })}
                      </Typography>
                      <Typography variant="caption">
                        {t('psychologists.scoreBreakdown.profile', {
                          score: score.profileCompletenessScore,
                        })}
                      </Typography>
                    </Stack>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="caption" color="text.secondary">
                      {t('psychologists.compare.reasons')}
                    </Typography>
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                      {reasons.length > 0 ? (
                        reasons.map((reason, reasonIndex) => (
                          <Chip
                            key={`${provider.userInfo.firebaseUid}-compare-reason-${reasonIndex}`}
                            size="small"
                            color="primary"
                            label={t('psychologists.whyMatched', { reason })}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {t('psychologists.compare.tags')}
                    </Typography>
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                      {tags.length > 0 ? (
                        tags.map((tag, index) => (
                          <Chip
                            key={`${provider.userInfo.firebaseUid}-compare-tag-${index}`}
                            size="small"
                            variant="outlined"
                            label={tag.text ?? tag.subType ?? t('psychologists.tagFallback')}
                          />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
          </Box>
        </>
      ) : null}
    </UISectionCard>
  );
}
