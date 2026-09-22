import { createReportQueryHooks } from "@universe/shared/queries";
import type { ReportsFilters } from "@/features/moderation/types";
import { httpClient } from "@/lib/api";

export type { ReportsFilters };

export const { useGetReportsInfiniteQuery, useGetReportedUsersSummaryQuery } =
  createReportQueryHooks(httpClient);
