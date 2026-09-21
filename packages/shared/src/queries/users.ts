import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createUsersApi } from "../api/users.js";
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
