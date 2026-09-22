import { queryOptions, useQuery } from "@tanstack/react-query";
import { createBlockApi } from "../api/block.js";
import type { HttpClient } from "../api/client.js";
import { blockKeys } from "./keys.js";

type BlockApi = ReturnType<typeof createBlockApi>;

export const createBlockQueries = (api: BlockApi) => ({
  blockedUsers: (enabled = true) =>
    queryOptions({
      queryKey: blockKeys.blockedUsers(),
      queryFn: () => api.listBlockedUsers(),
      enabled,
    }),
});

// Ready-to-use hooks for every read-only, side-effect-free block query —
// see the identical note on createUserQueryHooks in ./users.ts for why this
// exists instead of each app redeclaring the same useQuery wrapper.
export const createBlockQueryHooks = (httpClient: HttpClient) => {
  const api = createBlockApi(httpClient);
  const queries = createBlockQueries(api);
  return {
    useGetBlockedUsers: (enabled = true) => useQuery(queries.blockedUsers(enabled)),
  };
};
