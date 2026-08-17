import { useQuery } from "@tanstack/react-query";
import { usePollStore } from "../../store/pollStore";

export const useGetMyPollVoteQuery = (pollId?: string) => {
  const { getMyPollVote } = usePollStore();
  return useQuery({
    queryFn: () => getMyPollVote(pollId as string),
    queryKey: ["myPollVote", pollId],
    enabled: !!pollId,
  });
};
