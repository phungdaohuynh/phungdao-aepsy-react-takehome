'use client';

import { useTranslation } from '@workspace/localization';
import { useEffect } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  UIButton,
  UIEmptyState,
  UILoadingState,
  UIListSkeleton,
  UISectionCard
} from '@workspace/ui';

import { usePsychologistsQuery } from '@/features/psychologists/api/use-psychologists-query';
import { getProviderMatchReasons } from '@/features/psychologists/lib/provider-matching';
import { env } from '@/shared/config/env';
import { trackEvent } from '@/shared/lib/analytics';
import { useAppStore } from '@/shared/state/store';

const DEFAULT_GRAPHQL_ENDPOINT = 'https://api-dev.aepsy.com/graphql';

function getFullName(firstName: string | null | undefined, lastName: string | null | undefined) {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '';
}

export function StepPsychologists() {
  const { t } = useTranslation();
  const selectedTopics = useAppStore((state) => state.selectedTopics);
  const setStep = useAppStore((state) => state.setStep);

  const endpoint = env.NEXT_PUBLIC_AEPSY_GRAPHQL_ENDPOINT ?? DEFAULT_GRAPHQL_ENDPOINT;

  const query = usePsychologistsQuery({
    rawDisorders: selectedTopics,
    endpoint,
    pageSize: 8
  });

  const providers = (query.data?.pages ?? []).flatMap((page) => page.items);

  const uniqueProviders = providers.filter((provider, index) => {
    return providers.findIndex((item) => item.userInfo.firebaseUid === provider.userInfo.firebaseUid) === index;
  });

  const totalSize = query.data?.pages[0]?.totalSize ?? 0;

  useEffect(() => {
    if (query.isSuccess && uniqueProviders.length > 0) {
      trackEvent('providers_loaded', {
        providers: uniqueProviders.length,
        topics: selectedTopics.length
      });
    }
  }, [query.isSuccess, selectedTopics.length, uniqueProviders.length]);

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
    <UISectionCard title={t('psychologists.title')} subheader={t('psychologists.subheader', { endpoint, count: selectedTopics.length })}>
      <Stack spacing={2.5} data-testid="step-psychologists">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <UIButton variant="outlined" onClick={() => setStep('topics')}>
            {t('psychologists.actions.backToStep2')}
          </UIButton>
        </Stack>

        {query.isLoading ? (
          <>
            <UILoadingState label={t('psychologists.loading')} />
            <UIListSkeleton rows={4} />
          </>
        ) : null}

        {query.error ? <Alert severity="error">{t('psychologists.error')}</Alert> : null}

        {!query.isLoading && !query.error && uniqueProviders.length === 0 ? (
          <UIEmptyState
            title={t('psychologists.emptyTitle')}
            description={t('psychologists.emptyDescription')}
            action={
              <UIButton variant="text" onClick={() => void query.refetch()}>
                {t('common.retry')}
              </UIButton>
            }
          />
        ) : null}

        {uniqueProviders.length > 0 ? (
          <>
            <Typography variant="body2" color="text.secondary">
              {t('psychologists.showingCount', { shown: uniqueProviders.length, total: totalSize })}
            </Typography>

            <Stack spacing={1.5} divider={<Divider flexItem />}>
              {uniqueProviders.map((provider, index) => {
                const fullName = getFullName(provider.userName.firstName, provider.userName.lastName);
                const providerTitle = provider.profile?.providerInfo?.providerTitle ?? t('psychologists.defaultProviderTitle');
                const yearExperience = provider.profile?.providerInfo?.yearExperience;
                const tags = provider.profile?.providerTagInfo?.tags ?? [];
                const matchReasons = getProviderMatchReasons(provider, selectedTopics);

                return (
                  <Box key={provider.userInfo.firebaseUid} data-testid={`provider-card-${provider.userInfo.firebaseUid}`}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                      <Avatar src={provider.userInfo.avatar ?? undefined} alt={fullName || t('psychologists.unknownProvider')} />

                      <Stack spacing={0.8} sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {fullName || t('psychologists.unknownProvider')}
                          </Typography>
                          <Chip size="small" color="secondary" variant="outlined" label={t('psychologists.rank', { rank: index + 1 })} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {providerTitle}
                          {typeof yearExperience === 'number' ? ` • ${t('psychologists.yearsExperience', { years: yearExperience })}` : ''}
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
                          {matchReasons.map((reason, reasonIndex) => (
                            <Chip
                              key={`${provider.userInfo.firebaseUid}-reason-${reasonIndex}`}
                              size="small"
                              color="primary"
                              label={t('psychologists.whyMatched', { reason })}
                            />
                          ))}
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
                  zIndex: 5
                }}
              >
                <UIButton
                  onClick={() => {
                    trackEvent('load_more_clicked', { shown: uniqueProviders.length });
                    void query.fetchNextPage();
                  }}
                  disabled={query.isFetchingNextPage}
                  data-testid="psychologists-load-more-button"
                >
                  {query.isFetchingNextPage ? t('common.loadingMore') : t('common.loadMore')}
                </UIButton>
              </Box>
            ) : null}
          </>
        ) : null}
      </Stack>
    </UISectionCard>
  );
}
