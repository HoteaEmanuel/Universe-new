import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createCommentsApi } from "../api/comments.js";
import type { HttpClient } from "../api/client.js";
import { commentKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type CommentsApi = ReturnType<typeof createCommentsApi>;

export const createCommentQueries = (api: CommentsApi) => ({
  list: (postId?: string) =>
    infiniteQueryOptions({
      queryKey: commentKeys.list(postId ?? ""),
      queryFn: ({ pageParam }) => api.list(postId as string, pageParam),
      ...cursorPagination(),
      enabled: !!postId,
    }),

  replies: (postId?: string, parentId?: string) =>
    infiniteQueryOptions({
      queryKey: commentKeys.replies(postId ?? "", parentId ?? ""),
      queryFn: ({ pageParam }) => api.listReplies(postId as string, parentId as string, pageParam),
      ...cursorPagination(),
      enabled: !!postId && !!parentId,
    }),

  count: (postId?: string) =>
    queryOptions({
      queryKey: commentKeys.count(postId ?? ""),
      queryFn: () => api.getCount(postId as string),
      enabled: !!postId,
    }),
});

// Ready-to-use hooks for every read-only, side-effect-free comment query —
// see the identical note on createUserQueryHooks in ./users.ts for why this
// exists instead of each app redeclaring the same useQuery wrapper.
export const createCommentQueryHooks = (httpClient: HttpClient) => {
  const api = createCommentsApi(httpClient);
  const queries = createCommentQueries(api);
  return {
    useGetPostCommentsInfinite: (postId?: string) => useInfiniteQuery(queries.list(postId)),
    useGetCommentRepliesInfinite: (postId?: string, parentId?: string) =>
      useInfiniteQuery(queries.replies(postId, parentId)),
    useGetPostCommentsCount: (postId?: string) => useQuery(queries.count(postId)),
  };
};
