import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createAdminApi } from "@universe/shared/api";
import { createAdminMutations } from "@universe/shared/mutations";
import { httpClient } from "@/lib/api";

const adminApi = createAdminApi(httpClient);

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();
  const shared = createAdminMutations(adminApi, queryClient).blockUser();
  return useMutation({
    ...shared,
    onError: () => {
      toast.error("Could not block user");
    },
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("User blocked");
    },
  });
};

export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient();
  const shared = createAdminMutations(adminApi, queryClient).unblockUser();
  return useMutation({
    ...shared,
    onError: () => {
      toast.error("Could not unblock user");
    },
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("User unblocked");
    },
  });
};
