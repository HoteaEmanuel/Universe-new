import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useReportStore } from "@/store/reportStore";
import type { CreateReportPayload, ReportResolveAction } from "@/features/moderation/types";

export const useCreateReportMutation = () => {
  const { createReport } = useReportStore();
  return useMutation({
    mutationFn: (payload: CreateReportPayload) => createReport(payload),
    onSuccess: () => {
      toast.success("Report submitted. Thanks for helping keep Universe safe.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useResolveReportMutation = () => {
  const { resolveReport } = useReportStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      note,
    }: {
      id: string;
      action: ReportResolveAction;
      note?: string;
    }) => resolveReport(id, action, note),
    onSuccess: () => {
      toast.success("Report resolved");
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminReportsSummary"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
