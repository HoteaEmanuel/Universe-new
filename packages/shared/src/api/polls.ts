import type { Poll } from "../poll.js";
import type { HttpClient } from "./client.js";

export const createPollsApi = (client: HttpClient) => ({
  getMyVote: async (pollId: string) =>
    (await client.get<{ optionId: string | null }>(`/polls/${pollId}/my-vote`)).optionId,

  vote: async (pollId: string, optionId: string) =>
    (await client.post<{ poll: Poll }>(`/polls/${pollId}/vote`, { optionId })).poll,

  close: async (pollId: string) => (await client.post<{ poll: Poll }>(`/polls/${pollId}/close`)).poll,
});
