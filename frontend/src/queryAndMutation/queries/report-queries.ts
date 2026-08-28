import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useReportStore, type ReportsFilters } from "@/store/reportStore";
import type { ReportsPage } from "@/features/moderation/types";

export const useGetReportsInfiniteQuery = (filters: ReportsFilters) => {
  const { getReportsPage } = useReportStore();
  return useInfiniteQuery<ReportsPage>({
    queryKey: ["adminReports", filters],
    queryFn: ({ pageParam }) =>
      getReportsPage(filters, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
};

export const useGetReportedUsersSummaryQuery = () => {
  const { getReportedUsersSummary } = useReportStore();
  return useQuery({
    queryKey: ["adminReportsSummary"],
    queryFn: () => getReportedUsersSummary(),
  });
};
