import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createSearchApi } from "../api/search.js";
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
