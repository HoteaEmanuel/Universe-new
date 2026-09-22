import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createSearchApi } from "../api/search.js";
import type { HttpClient } from "../api/client.js";
import { searchKeys } from "./keys.js";
import { offsetPagination } from "./pageHelpers.js";

type SearchApi = ReturnType<typeof createSearchApi>;

export const createSearchQueries = (api: SearchApi) => ({
  overview: (query: string, enabled: boolean) =>
    queryOptions({
      queryKey: searchKeys.overview(query),
      queryFn: () => api.overview(query),
      enabled,
    }),

  users: (query: string, enabled: boolean) =>
    infiniteQueryOptions({
      queryKey: searchKeys.users(query),
      queryFn: ({ pageParam }) => api.listUsers(query, pageParam),
      ...offsetPagination(),
      enabled,
    }),

  posts: (query: string, enabled: boolean) =>
    infiniteQueryOptions({
      queryKey: searchKeys.posts(query),
      queryFn: ({ pageParam }) => api.listPosts(query, pageParam),
      ...offsetPagination(),
      enabled,
    }),

  groups: (query: string, enabled: boolean) =>
    infiniteQueryOptions({
      queryKey: searchKeys.groups(query),
      queryFn: ({ pageParam }) => api.listGroups(query, pageParam),
      ...offsetPagination(),
      enabled,
    }),
});

// Ready-to-use hooks for every read-only, side-effect-free search query —
// see the identical note on createUserQueryHooks in ./users.ts for why this
// exists instead of each app redeclaring the same useQuery wrapper.
export const createSearchQueryHooks = (httpClient: HttpClient) => {
  const api = createSearchApi(httpClient);
  const queries = createSearchQueries(api);
  return {
    useSearchOverviewQuery: (query: string, enabled: boolean) => useQuery(queries.overview(query, enabled)),
    useSearchUsersInfinite: (query: string, enabled: boolean) =>
      useInfiniteQuery(queries.users(query, enabled)),
    useSearchPostsInfinite: (query: string, enabled: boolean) =>
      useInfiniteQuery(queries.posts(query, enabled)),
    useSearchGroupsInfinite: (query: string, enabled: boolean) =>
      useInfiniteQuery(queries.groups(query, enabled)),
  };
};
