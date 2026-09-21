import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createReportsApi } from "../api/reports.js";
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
