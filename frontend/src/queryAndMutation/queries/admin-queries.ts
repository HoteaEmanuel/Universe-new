import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createAdminApi } from "@universe/shared/api";
import { createAdminQueries } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

const adminApi = createAdminApi(httpClient);
const adminQueries = createAdminQueries(adminApi);

export const useGetAdminStatsQuery = () => useQuery(adminQueries.stats());

export const useGetDailyActivityQuery = () => useQuery(adminQueries.dailyActivity());

export const useGetTopUniversitiesQuery = () => useQuery(adminQueries.topUniversities());

export const useGetUsersInfiniteQuery = (search: string) => useInfiniteQuery(adminQueries.users(search));
