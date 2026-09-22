import { createPollQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const { useGetMyPollVoteQuery } = createPollQueryHooks(httpClient);
