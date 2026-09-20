import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createCommentsApi } from "../api/comments.js";
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
