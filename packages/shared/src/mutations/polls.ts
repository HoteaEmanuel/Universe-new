import { mutationOptions, type QueryClient, type QueryKey } from "@tanstack/react-query";
import type { createPollsApi } from "../api/polls.js";
import { pollKeys } from "../queries/keys.js";

type PollsApi = ReturnType<typeof createPollsApi>;

// Polls are embedded inside posts and group/conversation messages rather
// than owning a detail view of their own, so the caller (`PollBlock.tsx`)
// is the one who knows which other cached entries (the post detail, the
// message list, ...) need invalidating alongside the poll's own vote
// cache - passed straight through as `invalidateKeys`, same as the
// original store-based hooks.
export const createPollMutations = (api: PollsApi, queryClient: QueryClient) => ({
  vote: (pollId: string, invalidateKeys: QueryKey[] = []) => {
    const queryKey = pollKeys.myVote(pollId);
    return mutationOptions({
      mutationFn: (optionId: string) => api.vote(pollId, optionId),
      onMutate: async (optionId: string) => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<string | null>(queryKey);
        queryClient.setQueryData(queryKey, optionId);
        return { previous };
      },
      onError: (_error, _optionId, context) => {
        queryClient.setQueryData(queryKey, context?.previous ?? null);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      },
    });
  },

  close: (pollId: string, invalidateKeys: QueryKey[] = []) =>
    mutationOptions({
      mutationFn: () => api.close(pollId),
      onSuccess: () => {
        invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
      },
    }),
});
