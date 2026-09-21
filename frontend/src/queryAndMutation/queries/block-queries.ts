import { useQuery } from "@tanstack/react-query";
import { createBlockApi } from "@universe/shared/api";
import { createBlockQueries } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

const blockApi = createBlockApi(httpClient);
const blockQueries = createBlockQueries(blockApi);

export const useGetBlockedUsers = (enabled = true) => useQuery(blockQueries.blockedUsers(enabled));
