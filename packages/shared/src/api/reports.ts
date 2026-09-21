import type {
  CreateReportPayload,
  Report,
  ReportedUserSummaryRow,
  ReportResolveAction,
  ReportsFilters,
  ReportsPage,
} from "../moderation.js";
import type { HttpClient } from "./client.js";

export const createReportsApi = (client: HttpClient) => ({
  create: async (payload: CreateReportPayload) =>
    (await client.post<{ report: Report }>("/reports", payload)).report,

  listPage: (filters: ReportsFilters, cursor?: string) =>
    client.get<ReportsPage>("/admin/reports", { ...filters, cursor }),

  getSummary: async () =>
    (await client.get<{ summary: ReportedUserSummaryRow[] }>("/admin/reports/summary")).summary,

  resolve: async (id: string, action: ReportResolveAction, note?: string) =>
    (await client.post<{ report: Report }>(`/admin/reports/${id}/resolve`, { action, note })).report,
});
