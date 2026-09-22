import { createPostQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const {
  useGetPostQuery,
  useGetUserPostsQuery,
  usePostUserQuery,
  useGetLikesQuery,
  useGetRelevantLikerQuery,
  usePostLikedQuery,
  useGetPostsInfiniteQuery,
} = createPostQueryHooks(httpClient);
