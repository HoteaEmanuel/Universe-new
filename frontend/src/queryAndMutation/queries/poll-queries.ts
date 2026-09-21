import { useQuery } from "@tanstack/react-query";
import { createPollsApi } from "@universe/shared/api";
import { createPollQueries } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

const pollsApi = createPollsApi(httpClient);
const pollQueries = createPollQueries(pollsApi);

export const useGetMyPollVoteQuery = (pollId?: string) => useQuery(pollQueries.myVote(pollId));
