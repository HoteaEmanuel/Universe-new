import { queryOptions } from "@tanstack/react-query";
import type { createPollsApi } from "../api/polls.js";
import { pollKeys } from "./keys.js";

type PollsApi = ReturnType<typeof createPollsApi>;

export const createPollQueries = (api: PollsApi) => ({
  myVote: (pollId?: string) =>
    queryOptions({
      queryKey: pollKeys.myVote(pollId ?? ""),
      queryFn: () => api.getMyVote(pollId as string),
      enabled: !!pollId,
    }),
});
