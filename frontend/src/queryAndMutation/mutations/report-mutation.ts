import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createReportsApi } from "@universe/shared/api";
import { createReportMutations } from "@universe/shared/mutations";
import { httpClient } from "@/lib/api";

const reportsApi = createReportsApi(httpClient);

export const useCreateReportMutation = () => {
  const queryClient = useQueryClient();
  const shared = createReportMutations(reportsApi, queryClient).create();
  return useMutation({
    ...shared,
    onSuccess: () => {
      toast.success("Report submitted. Thanks for helping keep Universe safe.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useResolveReportMutation = () => {
  const queryClient = useQueryClient();
  const shared = createReportMutations(reportsApi, queryClient).resolve();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Report resolved");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
