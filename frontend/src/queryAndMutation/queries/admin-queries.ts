import { createAdminQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useGetAdminStatsQuery,
  useGetDailyActivityQuery,
  useGetTopUniversitiesQuery,
  useGetUsersInfiniteQuery,
} = createAdminQueryHooks(httpClient);
