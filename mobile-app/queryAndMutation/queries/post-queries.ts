import { createPostQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const {
  useGetPostQuery,
  useGetUserPostsQuery,
  useGetSavedPostsQuery,
  usePostUserQuery,
  useGetLikesQuery,
  useGetRelevantLikerQuery,
  usePostLikedQuery,
  useGetPostsInfiniteQuery,
  useOpportunitiesInfiniteQuery,
} = createPostQueryHooks(httpClient);
