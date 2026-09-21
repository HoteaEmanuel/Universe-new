import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createCommentsApi } from "@universe/shared/api";
import { createCommentQueries } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

const commentsApi = createCommentsApi(httpClient);
const commentQueries = createCommentQueries(commentsApi);

export const useGetPostCommentsInfinite = (id?: string) =>
  useInfiniteQuery(commentQueries.list(id));

export const useGetCommentRepliesInfinite = (postId?: string, parentId?: string) =>
  useInfiniteQuery(commentQueries.replies(postId, parentId));

export const useGetPostCommentsCount = (id?: string) => useQuery(commentQueries.count(id));
