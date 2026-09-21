import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createPostsApi } from "@universe/shared/api";
import { createPostQueries } from "@universe/shared/queries";
import type { OpportunityFilters } from "../types";
import { httpClient } from "@/lib/api";

const postsApi = createPostsApi(httpClient);
const postQueries = createPostQueries(postsApi);

export const useGetPostQuery = (id?: string) => useQuery(postQueries.detail(id));

export const useOpportunitiesInfiniteQuery = (filters: OpportunityFilters) =>
  useInfiniteQuery(postQueries.opportunities(filters));

export const useGetLikesQuery = (postId: string) => useQuery(postQueries.likesCount(postId));

export const useGetRelevantLikerQuery = (postId: string) =>
  useQuery(postQueries.relevantLiker(postId));

export const useGetSavedPostsQuery = (id: string) => useQuery(postQueries.saved(id));

export const useCheckPostIsSaved = (id: string) => useQuery(postQueries.savedStatus(id));

export const useGetUserPostsQuery = (id?: string) => useQuery(postQueries.byUser(id));

export const useGetPostsInfiniteQuery = (feedSelector: string) =>
  useInfiniteQuery(postQueries.feed(feedSelector));

// `postId` is accepted for call-site compatibility (both current call sites
// pass it) but no longer used for cache keying - the cache now keys by
// author id, so posts by the same author share one lookup instead of each
// post refetching the author independently.
export const usePostUserQuery = (id: string, _postId: string) =>
  useQuery(postQueries.author(id));

export const usePostLikedQuery = (postId: string) => useQuery(postQueries.liked(postId));

export const useGetRelatedPostsQuery = (tag: string) => useQuery(postQueries.related(tag));

export const useGetUsersWhoLikedInfiniteQuery = (postId: string) =>
  useInfiniteQuery(postQueries.whoLiked(postId));

export const useGetPostsByNameQuery = (name: string) => useQuery(postQueries.byName(name));

export const useGetPublicPostQuery = (id?: string) => useQuery(postQueries.public(id));

export const useGetShareRecipientsQuery = (enabled: boolean) =>
  useQuery(postQueries.shareRecipients(enabled));
