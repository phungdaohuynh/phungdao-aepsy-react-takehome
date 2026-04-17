import { GraphQLClient } from 'graphql-request';

export function createGraphQLClient(endpoint: string, token?: string) {
  const config = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    : {};

  return new GraphQLClient(endpoint, config);
}
