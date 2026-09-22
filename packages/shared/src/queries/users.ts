import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createUsersApi } from "../api/users.js";
import type { HttpClient } from "../api/client.js";
import { userKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type UsersApi = ReturnType<typeof createUsersApi>;

export const createUserQueries = (api: UsersApi) => ({
  all: () => queryOptions({ queryKey: userKeys.all(), queryFn: () => api.list() }),

  detail: (id?: string) =>
    queryOptions({
      queryKey: userKeys.detail(id ?? ""),
      queryFn: () => api.getById(id as string),
      enabled: !!id,
    }),

  byUsername: (username?: string) =>
    queryOptions({
      queryKey: userKeys.byUsername(username ?? ""),
      queryFn: () => api.getByUsername(username as string),
      enabled: !!username,
    }),

  followers: (id?: string) =>
    queryOptions({
      queryKey: userKeys.followers(id ?? ""),
      queryFn: () => api.getFollowers(id as string),
      enabled: !!id,
    }),

  following: (id?: string) =>
    queryOptions({
      queryKey: userKeys.following(id ?? ""),
      queryFn: () => api.getFollowing(id as string),
      enabled: !!id,
    }),

  isFollowing: (id?: string) =>
    queryOptions({
      queryKey: userKeys.isFollowing(id ?? ""),
      queryFn: () => api.isFollowing(id as string),
      enabled: !!id,
    }),

  mentionSearch: (query: string, enabled: boolean) =>
    queryOptions({
      queryKey: userKeys.mentionSearch(query),
      queryFn: () => api.getMentionSearchUsers(query),
      enabled,
      staleTime: 30_000,
    }),

  relevantFollowers: (id?: string, search?: string) =>
    infiniteQueryOptions({
      queryKey: userKeys.relevantFollowers(id ?? "", search),
      queryFn: ({ pageParam }) => api.getRelevantFollowers(id as string, pageParam, search),
      ...cursorPagination(),
      enabled: !!id,
    }),

  relevantFollowing: (id?: string, search?: string) =>
    infiniteQueryOptions({
      queryKey: userKeys.relevantFollowing(id ?? "", search),
      queryFn: ({ pageParam }) => api.getRelevantFollowing(id as string, pageParam, search),
      ...cursorPagination(),
      enabled: !!id,
    }),

  // `enabled` is passed in by the caller since knowing whether the viewer
  // even has a real university to match on requires the auth user, not
  // just an id.
  universityPeople: (enabled: boolean) =>
    infiniteQueryOptions({
      queryKey: userKeys.universityPeople(),
      queryFn: ({ pageParam }) => api.getUniversityPeople(pageParam),
      ...cursorPagination(),
      enabled,
    }),
});

// Ready-to-use hooks for every read-only, side-effect-free user query.
// `useQuery`/`useInfiniteQuery` behave identically on web and React Native,
// so there's nothing platform-specific left to write once the HttpClient is
// supplied — each app's query file becomes a one-line re-export of this
// instead of redeclaring the same wrapper body. Mutations stay out of this
// (and out of this pattern generally): they compose toasts and other
// app-local side effects at the call site, which genuinely differs per
// platform.
export const createUserQueryHooks = (httpClient: HttpClient) => {
  const api = createUsersApi(httpClient);
  const queries = createUserQueries(api);
  return {
    useGetAllUsersQuery: () => useQuery(queries.all()),
    useGetUserByIdQuery: (id?: string) => useQuery(queries.detail(id)),
    useGetUserByUsernameQuery: (username?: string) => useQuery(queries.byUsername(username)),
    useGetFollowersQuery: (id?: string) => useQuery(queries.followers(id)),
    useGetFollowingQuery: (id?: string) => useQuery(queries.following(id)),
    useIsFollowingQuery: (id?: string) => useQuery(queries.isFollowing(id)),
    useMentionSearchUsersQuery: (query: string, enabled: boolean) =>
      useQuery(queries.mentionSearch(query, enabled)),
    useGetRelevantFollowersInfiniteQuery: (id?: string, search?: string) =>
      useInfiniteQuery(queries.relevantFollowers(id, search)),
    useGetRelevantFollowingInfiniteQuery: (id?: string, search?: string) =>
      useInfiniteQuery(queries.relevantFollowing(id, search)),
    useUniversityPeopleInfiniteQuery: (enabled: boolean) =>
      useInfiniteQuery(queries.universityPeople(enabled)),
  };
};
