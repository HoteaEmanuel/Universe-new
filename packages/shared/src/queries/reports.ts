import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createReportsApi } from "../api/reports.js";
import type { HttpClient } from "../api/client.js";
import type { ReportsFilters } from "../moderation.js";
import { reportKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type ReportsApi = ReturnType<typeof createReportsApi>;

export const createReportQueries = (api: ReportsApi) => ({
  list: (filters: ReportsFilters) =>
    infiniteQueryOptions({
      queryKey: reportKeys.list(filters),
      queryFn: ({ pageParam }) => api.listPage(filters, pageParam),
      ...cursorPagination(),
    }),

  summary: () => queryOptions({ queryKey: reportKeys.summary(), queryFn: () => api.getSummary() }),
});

// Ready-to-use hooks for every read-only, side-effect-free report query —
// see the identical note on createUserQueryHooks in ./users.ts for why this
// exists instead of each app redeclaring the same useQuery wrapper.
export const createReportQueryHooks = (httpClient: HttpClient) => {
  const api = createReportsApi(httpClient);
  const queries = createReportQueries(api);
  return {
    useGetReportsInfiniteQuery: (filters: ReportsFilters) => useInfiniteQuery(queries.list(filters)),
    useGetReportedUsersSummaryQuery: () => useQuery(queries.summary()),
  };
};
