import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePollStore } from "../../store/pollStore";

export const useVoteOnPollMutation = (
  pollId: string,
  invalidateKeys: QueryKey[] = [],
) => {
  const queryClient = useQueryClient();
  const { voteOnPoll } = usePollStore();
  return useMutation({
    mutationFn: (optionId: string) => voteOnPoll(pollId, optionId),
    onMutate: async (optionId) => {
      const queryKey = ["myPollVote", pollId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string | null>(queryKey);
      queryClient.setQueryData(queryKey, optionId);
      return { previous };
    },
    onError: (error: Error, _optionId, context) => {
      queryClient.setQueryData(["myPollVote", pollId], context?.previous ?? null);
      toast.error(error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["myPollVote", pollId] });
      invalidateKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
};

export const useClosePollMutation = (pollId: string, invalidateKeys: QueryKey[] = []) => {
  const queryClient = useQueryClient();
  const { closePoll } = usePollStore();
  return useMutation({
    mutationFn: () => closePoll(pollId),
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => {
      invalidateKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
};
