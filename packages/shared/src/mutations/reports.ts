import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createReportsApi } from "../api/reports.js";
import type { CreateReportPayload, ReportResolveAction } from "../moderation.js";
import { adminKeys, reportKeys } from "../queries/keys.js";

type ReportsApi = ReturnType<typeof createReportsApi>;

export const createReportMutations = (api: ReportsApi, queryClient: QueryClient) => ({
  create: () =>
    mutationOptions({
      mutationFn: (payload: CreateReportPayload) => api.create(payload),
    }),

  resolve: () =>
    mutationOptions({
      mutationFn: ({
        id,
        action,
        note,
      }: {
        id: string;
        action: ReportResolveAction;
        note?: string;
      }) => api.resolve(id, action, note),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: reportKeys.listAll() });
        queryClient.invalidateQueries({ queryKey: reportKeys.summary() });
        queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
        queryClient.invalidateQueries({ queryKey: adminKeys.usersAll() });
      },
    }),
});
