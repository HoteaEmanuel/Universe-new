import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createAdminApi } from "../api/admin.js";
import type { HttpClient } from "../api/client.js";
import { adminKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type AdminApi = ReturnType<typeof createAdminApi>;

export const createAdminQueries = (api: AdminApi) => ({
  stats: () => queryOptions({ queryKey: adminKeys.stats(), queryFn: () => api.getStats() }),

  dailyActivity: () =>
    queryOptions({ queryKey: adminKeys.dailyActivity(), queryFn: () => api.getDailyActivity() }),

  topUniversities: () =>
    queryOptions({ queryKey: adminKeys.topUniversities(), queryFn: () => api.getTopUniversities() }),

  users: (search: string) =>
    infiniteQueryOptions({
      queryKey: adminKeys.users(search),
      queryFn: ({ pageParam }) => api.listUsers(pageParam, search),
      ...cursorPagination(),
    }),
});

// Ready-to-use hooks for every read-only, side-effect-free admin query —
// see the identical note on createUserQueryHooks in ./users.ts for why this
// exists instead of each app redeclaring the same useQuery wrapper.
export const createAdminQueryHooks = (httpClient: HttpClient) => {
  const api = createAdminApi(httpClient);
  const queries = createAdminQueries(api);
  return {
    useGetAdminStatsQuery: () => useQuery(queries.stats()),
    useGetDailyActivityQuery: () => useQuery(queries.dailyActivity()),
    useGetTopUniversitiesQuery: () => useQuery(queries.topUniversities()),
    useGetUsersInfiniteQuery: (search: string) => useInfiniteQuery(queries.users(search)),
  };
};
