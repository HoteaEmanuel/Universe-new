import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createUsersApi } from "@universe/shared/api";
import { createUserQueries } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

const usersApi = createUsersApi(httpClient);
const userQueries = createUserQueries(usersApi);

export const useGetAllUsersQuery = () => useQuery(userQueries.all());

export const useGetUserByIdQuery = (id?: string) => useQuery(userQueries.detail(id));

export const useGetFollowingQuery = (id?: string) => useQuery(userQueries.following(id));

export const useGetFollowersQuery = (id?: string) => useQuery(userQueries.followers(id));

// Relevant-first, cursor-paginated variants for the Followers/Following
// sheets on a profile — distinct from the flat useGetFollowersQuery/
// useGetFollowingQuery above, which AddMembersModal still relies on for a
// complete, unpaginated list of the viewer's own followers/following.
export const useGetRelevantFollowersInfiniteQuery = (id?: string, search?: string) =>
  useInfiniteQuery(userQueries.relevantFollowers(id, search));

export const useGetRelevantFollowingInfiniteQuery = (id?: string, search?: string) =>
  useInfiniteQuery(userQueries.relevantFollowing(id, search));

// Relevance-first, cursor-paginated "people at your university" discovery
// feed for the Explore People tab's empty-query state.
export const useUniversityPeopleInfiniteQuery = (enabled: boolean) =>
  useInfiniteQuery(userQueries.universityPeople(enabled));

export const useIsFollowingQuery = (id?: string) => useQuery(userQueries.isFollowing(id));

export const useGetUserByUsernameQuery = (username?: string) =>
  useQuery(userQueries.byUsername(username));

export const useMentionSearchUsersQuery = (query: string, enabled: boolean) =>
  useQuery(userQueries.mentionSearch(query, enabled));
