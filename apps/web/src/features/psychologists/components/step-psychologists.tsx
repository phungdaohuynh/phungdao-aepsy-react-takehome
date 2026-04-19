'use client';

import { useTranslation } from '@workspace/localization';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
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
  const [isCompareOpen, setCompareOpen] = useState(false);

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
      filteredProviders.filter((item) => compareIds.includes(item.provider.userInfo.firebaseUid)),
    [compareIds, filteredProviders],
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
      subheader={t('psychologists.subheader', { endpoint, count: selectedTopics.length })}
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
                onClick={() => setCompareOpen(true)}
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
                          {typeof yearExperience === 'number'
                            ? ` • ${t('psychologists.yearsExperience', { years: yearExperience })}`
                            : ''}
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
                                  setCompareIds((current) => {
                                    if (current.includes(provider.userInfo.firebaseUid)) {
                                      return current.filter(
                                        (item) => item !== provider.userInfo.firebaseUid,
                                      );
                                    }

                                    if (current.length >= 3) {
                                      toast.showInfo(t('psychologists.toast.maxCompare'));
                                      return current;
                                    }

                                    return [...current, provider.userInfo.firebaseUid];
                                  });
                                  trackEvent('provider_compared', {
                                    provider: provider.userInfo.firebaseUid,
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

      <Drawer anchor="right" open={isCompareOpen} onClose={() => setCompareOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 420 }, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {t('psychologists.compare.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('psychologists.compare.description')}
          </Typography>

          {compareProviders.length === 0 ? (
            <Alert severity="info">{t('psychologists.compare.empty')}</Alert>
          ) : null}

          <Stack spacing={1.25}>
            {compareProviders.map(({ provider, score }) => {
              const name =
                getProviderFullName(provider.userName.firstName, provider.userName.lastName) ||
                t('psychologists.unknownProvider');
              const title =
                provider.profile?.providerInfo?.providerTitle ??
                t('psychologists.defaultProviderTitle');
              const years = provider.profile?.providerInfo?.yearExperience ?? 0;

              return (
                <Box
                  key={`compare-${provider.userInfo.firebaseUid}`}
                  sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {title}
                  </Typography>
                  <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={t('psychologists.matchScore', { score: score.totalScore })}
                    />
                    <Chip size="small" label={t('psychologists.yearsExperience', { years })} />
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <UIButton variant="outlined" onClick={() => setCompareOpen(false)}>
              {t('psychologists.compare.close')}
            </UIButton>
            <UIButton
              variant="text"
              onClick={() => {
                setCompareIds([]);
                setCompareOpen(false);
              }}
            >
              {t('psychologists.compare.clear')}
            </UIButton>
          </Stack>
        </Box>
      </Drawer>
    </UISectionCard>
  );
}
