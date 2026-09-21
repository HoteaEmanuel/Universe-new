import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createReportsApi } from "@universe/shared/api";
import { createReportQueries } from "@universe/shared/queries";
import type { ReportsFilters } from "@/features/moderation/types";
import { httpClient } from "@/lib/api";

export type { ReportsFilters };

const reportsApi = createReportsApi(httpClient);
const reportQueries = createReportQueries(reportsApi);

export const useGetReportsInfiniteQuery = (filters: ReportsFilters) =>
  useInfiniteQuery(reportQueries.list(filters));

export const useGetReportedUsersSummaryQuery = () => useQuery(reportQueries.summary());
