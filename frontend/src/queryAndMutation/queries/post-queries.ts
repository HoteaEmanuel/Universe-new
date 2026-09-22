import { createPostQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useGetPostQuery,
  useGetPublicPostQuery,
  usePostUserQuery,
  useGetUserPostsQuery,
  useGetSavedPostsQuery,
  useCheckPostIsSaved,
  useGetRelatedPostsQuery,
  useGetPostsByNameQuery,
  useGetLikesQuery,
  useGetRelevantLikerQuery,
  usePostLikedQuery,
  useGetShareRecipientsQuery,
  useGetPostsInfiniteQuery,
  useGetUsersWhoLikedInfiniteQuery,
  useOpportunitiesInfiniteQuery,
} = createPostQueryHooks(httpClient);
