import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPollsApi } from "@universe/shared/api";
import { createPollMutations } from "@universe/shared/mutations";
import { httpClient } from "@/lib/api";

const pollsApi = createPollsApi(httpClient);

export const useVoteOnPollMutation = (pollId: string, invalidateKeys: QueryKey[] = []) => {
  const queryClient = useQueryClient();
  const shared = createPollMutations(pollsApi, queryClient).vote(pollId, invalidateKeys);
  return useMutation({
    ...shared,
    onError: (error: Error, optionId, onMutateResult, context) => {
      shared.onError?.(error, optionId, onMutateResult, context);
      toast.error(error.message);
    },
  });
};

export const useClosePollMutation = (pollId: string, invalidateKeys: QueryKey[] = []) => {
  const queryClient = useQueryClient();
  const shared = createPollMutations(pollsApi, queryClient).close(pollId, invalidateKeys);
  return useMutation({
    ...shared,
    onError: (error: Error) => toast.error(error.message),
  });
};
