import { createPostQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useGetPostQuery,
  useGetPublicPostQuery,
  useGetUserPostsQuery,
  useGetSavedPostsQuery,
  useCheckPostIsSaved,
  useGetRelatedPostsQuery,
  useGetPostsByNameQuery,
  useGetRelevantLikerQuery,
  useGetShareRecipientsQuery,
  useGetPostsInfiniteQuery,
  useGetUsersWhoLikedInfiniteQuery,
  useOpportunitiesInfiniteQuery,
} = createPostQueryHooks(httpClient);
