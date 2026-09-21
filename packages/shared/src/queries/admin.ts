import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createAdminApi } from "../api/admin.js";
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
