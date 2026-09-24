import { createUserQueryHooks } from "@universe/shared/queries";
import { httpClient } from "../../lib/http";

export const {
  useGetUserByIdQuery,
  useGetFollowingQuery,
  useGetFollowersQuery,
  useIsFollowingQuery,
  useGetAllUsersQuery,
  useGetRelevantFollowersInfiniteQuery,
  useGetRelevantFollowingInfiniteQuery,
} = createUserQueryHooks(httpClient);
