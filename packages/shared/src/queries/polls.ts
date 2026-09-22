import { queryOptions, useQuery } from "@tanstack/react-query";
import { createPollsApi } from "../api/polls.js";
import type { HttpClient } from "../api/client.js";
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

// Ready-to-use hooks for every read-only, side-effect-free poll query — see
// the identical note on createUserQueryHooks in ./users.ts for why this
// exists instead of each app redeclaring the same useQuery wrapper.
export const createPollQueryHooks = (httpClient: HttpClient) => {
  const api = createPollsApi(httpClient);
  const queries = createPollQueries(api);
  return {
    useGetMyPollVoteQuery: (pollId?: string) => useQuery(queries.myVote(pollId)),
  };
};
