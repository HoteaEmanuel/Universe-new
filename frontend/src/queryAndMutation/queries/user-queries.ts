import { createUserQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useGetFollowingQuery,
  useGetFollowersQuery,
  useGetRelevantFollowersInfiniteQuery,
  useGetRelevantFollowingInfiniteQuery,
  useUniversityPeopleInfiniteQuery,
  useIsFollowingQuery,
  useGetUserByUsernameQuery,
  useMentionSearchUsersQuery,
} = createUserQueryHooks(httpClient);
