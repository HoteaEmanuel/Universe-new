import { useUserStore } from "../../store/userStore";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FollowListPage, MentionUser, UniversityPeoplePage } from "../types";

export const useGetAllUsersQuery = () => {
  const { getAllUsers } = useUserStore();
  return useQuery({
    queryFn: async () => await getAllUsers(),
    queryKey: ["allUsers"],
  });
};
export const useGetUserByIdQuery = (id?: string) => {
  const { getUserById } = useUserStore();
  return useQuery({
    queryFn: async () => await getUserById(id as string),
    queryKey: ["user", id],
    enabled: !!id,
  });
};
export const useGetFollowingQuery = (id?: string) => {
  const { getFollowing } = useUserStore();
  return useQuery({
    queryFn: () => getFollowing(id),
    queryKey: ["following", id],
    enabled: !!id,
  });
};
export const useGetFollowersQuery = (id?: string) => {
  const { getFollowers } = useUserStore();
  return useQuery({
    queryFn: () => getFollowers(id),
    queryKey: ["followers", id],
    enabled: !!id,
  });
};

// Relevant-first, cursor-paginated variants for the Followers/Following
// sheets on a profile — distinct from the flat useGetFollowersQuery/
// useGetFollowingQuery above, which AddMembersModal still relies on for a
// complete, unpaginated list of the viewer's own followers/following.
export const useGetRelevantFollowersInfiniteQuery = (
  id?: string,
  search?: string,
) => {
  const { getRelevantFollowers } = useUserStore();
  return useInfiniteQuery<FollowListPage>({
    queryKey: ["followers-relevant", id, search],
    queryFn: ({ pageParam }) =>
      getRelevantFollowers(
        id,
        pageParam as string | undefined,
        search,
      ) as Promise<FollowListPage>,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id,
  });
};
export const useGetRelevantFollowingInfiniteQuery = (
  id?: string,
  search?: string,
) => {
  const { getRelevantFollowing } = useUserStore();
  return useInfiniteQuery<FollowListPage>({
    queryKey: ["following-relevant", id, search],
    queryFn: ({ pageParam }) =>
      getRelevantFollowing(
        id,
        pageParam as string | undefined,
        search,
      ) as Promise<FollowListPage>,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!id,
  });
};

// Relevance-first, cursor-paginated "people at your university" discovery
// feed for the Explore People tab's empty-query state — `enabled` is passed
// in by the caller since knowing whether the viewer even has a real
// university to match on requires the auth user, not just an id.
export const useUniversityPeopleInfiniteQuery = (enabled: boolean) => {
  const { getUniversityPeople } = useUserStore();
  return useInfiniteQuery<UniversityPeoplePage>({
    queryKey: ["university-people"],
    queryFn: ({ pageParam }) =>
      getUniversityPeople(
        pageParam as string | undefined,
      ) as Promise<UniversityPeoplePage>,
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
  });
};

export const useIsFollowingQuery = (id?: string) => {
  const { isFollowing } = useUserStore();
  return useQuery({
    queryFn: () => isFollowing(id),
    queryKey: ["isFollowing", id],
    enabled: !!id,
  });
};

export const useGetUserByUsernameQuery = (username?: string) => {
  const { getUserByUsername } = useUserStore();
  return useQuery({
    queryFn: async () => await getUserByUsername(username as string),
    queryKey: ["userByUsername", username],
    enabled: !!username,
  });
};

export const useMentionSearchUsersQuery = (query: string, enabled: boolean) => {
  const { getMentionSearchUsers } = useUserStore();
  return useQuery({
    queryKey: ["mention-search", query],
    queryFn: () => getMentionSearchUsers(query) as Promise<MentionUser[]>,
    enabled,
    staleTime: 30_000,
  });
};
