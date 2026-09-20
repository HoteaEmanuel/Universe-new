import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createPostsApi } from "../api/posts.js";
import type { OpportunityFilters } from "../post.js";
import { postKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type PostsApi = ReturnType<typeof createPostsApi>;

export const createPostQueries = (api: PostsApi) => ({
  // The original `useGetPostQuery` had no `enabled` guard, so calling it
  // with an undefined id (a route param not ready yet) would hit
  // `GET /post/undefined` on the backend. Guarded like every other
  // optional-id query below.
  detail: (id?: string) =>
    queryOptions({
      queryKey: postKeys.detail(id ?? ""),
      queryFn: () => api.get(id as string),
      enabled: !!id,
    }),

  public: (id?: string) =>
    queryOptions({
      queryKey: postKeys.public(id ?? ""),
      queryFn: () => api.getPublic(id as string),
      enabled: !!id,
      retry: false,
    }),

  // Keyed by author id rather than the original per-post `["creator", postId]`
  // key, so posts by the same author share one cache entry instead of each
  // post refetching the author independently.
  author: (id?: string) =>
    queryOptions({
      queryKey: postKeys.author(id ?? ""),
      queryFn: () => api.getAuthor(id as string),
      enabled: !!id,
    }),

  byUser: (id?: string) =>
    queryOptions({
      queryKey: postKeys.byUser(id ?? ""),
      queryFn: () => api.listByUser(id as string),
      enabled: !!id,
    }),

  saved: (id: string) =>
    queryOptions({ queryKey: postKeys.saved(id), queryFn: () => api.listSaved(id) }),

  savedStatus: (id: string) =>
    queryOptions({ queryKey: postKeys.savedStatus(id), queryFn: () => api.isSaved(id) }),

  related: (tag: string) =>
    queryOptions({ queryKey: postKeys.related(tag), queryFn: () => api.listRelated(tag) }),

  byName: (name: string) =>
    queryOptions({ queryKey: postKeys.byName(name), queryFn: () => api.searchByName(name) }),

  likesCount: (postId: string) =>
    queryOptions({ queryKey: postKeys.likesCount(postId), queryFn: () => api.getLikesCount(postId) }),

  relevantLiker: (postId: string) =>
    queryOptions({
      queryKey: postKeys.relevantLiker(postId),
      queryFn: () => api.getRelevantLiker(postId),
    }),

  liked: (postId: string) =>
    queryOptions({ queryKey: postKeys.liked(postId), queryFn: () => api.hasLiked(postId) }),

  shareRecipients: (enabled: boolean) =>
    queryOptions({
      queryKey: postKeys.shareRecipients(),
      queryFn: () => api.getShareRecipients(),
      enabled,
    }),

  feed: (feedSelector: string) =>
    infiniteQueryOptions({
      queryKey: postKeys.feed(feedSelector),
      queryFn: ({ pageParam }) => api.list(feedSelector, pageParam),
      ...cursorPagination(),
    }),

  whoLiked: (postId: string) =>
    infiniteQueryOptions({
      queryKey: postKeys.whoLiked(postId),
      queryFn: ({ pageParam }) => api.listWhoLiked(postId, pageParam),
      ...cursorPagination(),
    }),

  opportunities: (filters: OpportunityFilters) =>
    infiniteQueryOptions({
      queryKey: postKeys.opportunities(filters),
      queryFn: ({ pageParam }) => api.listOpportunities(filters, pageParam),
      ...cursorPagination(),
    }),
});
