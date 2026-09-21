import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createBlockApi } from "@universe/shared/api";
import { createBlockMutations } from "@universe/shared/mutations";
import { httpClient } from "@/lib/api";

const blockApi = createBlockApi(httpClient);

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();
  const shared = createBlockMutations(blockApi, queryClient).block();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("User blocked");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient();
  const shared = createBlockMutations(blockApi, queryClient).unblock();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("User unblocked");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
