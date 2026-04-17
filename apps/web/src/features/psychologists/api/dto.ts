export type ProviderTag = {
  type: string | null;
  subType: string | null;
  text: string | null;
};

export type ProviderItem = {
  userInfo: {
    firebaseUid: string;
    avatar: string | null;
  };
  userName: {
    firstName: string | null;
    lastName: string | null;
  };
  profile: {
    providerInfo: {
      yearExperience: number | null;
      providerTitle: string | null;
    } | null;
    providerTagInfo: {
      tags: ProviderTag[];
    } | null;
  } | null;
};

export type SearchProvidersNodeDto = {
  id: string;
  providers: {
    canLoadMore: boolean;
    totalSize: number;
    providers: ProviderItem[];
  };
};

export type SearchProvidersResponseDto = {
  searchProviders: SearchProvidersNodeDto | SearchProvidersNodeDto[];
};

export type SearchProvidersPage = {
  items: ProviderItem[];
  canLoadMore: boolean;
  totalSize: number;
  pageNum: number;
};

export type SearchProvidersQueryParams = {
  rawDisorders: string[];
  endpoint: string;
  pageSize?: number;
};
