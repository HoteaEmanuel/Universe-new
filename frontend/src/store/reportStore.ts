import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type {
  CreateReportPayload,
  Report,
  ReportedUserSummaryRow,
  ReportReason,
  ReportResolveAction,
  ReportsPage,
  ReportStatus,
  ReportTargetType,
} from "@/features/moderation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
  fallback;

export type ReportsFilters = {
  status?: ReportStatus;
  reason?: ReportReason;
  targetType?: ReportTargetType;
  search?: string;
};

type ReportStore = {
  createReport: (payload: CreateReportPayload) => Promise<Report>;
  getReportsPage: (filters: ReportsFilters, cursor?: string) => Promise<ReportsPage>;
  getReportedUsersSummary: () => Promise<ReportedUserSummaryRow[]>;
  resolveReport: (
    id: string,
    action: ReportResolveAction,
    note?: string,
  ) => Promise<Report>;
};

export const useReportStore = create<ReportStore>(() => ({
  createReport: async (payload) => {
    try {
      const response = await axios.post(`${API_URL}/reports`, payload);
      return response.data.report;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not submit report"));
    }
  },
  getReportsPage: async (filters, cursor) => {
    try {
      const response = await axios.get(`${API_URL}/admin/reports`, {
        params: { ...filters, cursor },
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load reports"));
    }
  },
  getReportedUsersSummary: async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/reports/summary`);
      return response.data.summary;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load report summary"));
    }
  },
  resolveReport: async (id, action, note) => {
    try {
      const response = await axios.post(`${API_URL}/admin/reports/${id}/resolve`, {
        action,
        note,
      });
      return response.data.report;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not resolve report"));
    }
  },
}));
