import { createPostQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const {
  useGetPostQuery,
  useGetUserPostsQuery,
  useGetSavedPostsQuery,
  useGetRelevantLikerQuery,
  useGetPostsInfiniteQuery,
  useOpportunitiesInfiniteQuery,
} = createPostQueryHooks(httpClient);
