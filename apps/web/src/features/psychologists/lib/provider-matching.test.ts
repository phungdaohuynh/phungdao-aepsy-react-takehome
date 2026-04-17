import { describe, expect, it } from 'vitest';

import type { ProviderItem } from '@/features/psychologists/api/use-psychologists-query';
import { getProviderMatchReasons } from '@/features/psychologists/lib/provider-matching';

const baseProvider: ProviderItem = {
  userInfo: { firebaseUid: 'provider-1', avatar: null },
  userName: { firstName: 'Demo', lastName: 'Provider' },
  profile: {
    providerInfo: { yearExperience: 4, providerTitle: 'Psychologist' },
    providerTagInfo: {
      tags: [{ type: 'DISORDER', subType: 'ANXIETY', text: 'Stress' }]
    }
  }
};

describe('getProviderMatchReasons', () => {
  it('returns matched tags when available', () => {
    const reasons = getProviderMatchReasons(baseProvider, ['stress']);
    expect(reasons).toEqual(['Stress']);
  });

  it('falls back to selected topics when no matching tags', () => {
    const reasons = getProviderMatchReasons(baseProvider, ['U_DIS_TRAUMA', 'U_DIS_SLEEP_PROBLEM']);
    expect(reasons).toEqual(['trauma', 'sleep problem']);
  });
});
