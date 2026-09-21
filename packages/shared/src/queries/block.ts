import { queryOptions } from "@tanstack/react-query";
import type { createBlockApi } from "../api/block.js";
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
