import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createBlockApi } from "../api/block.js";
import { blockKeys, conversationKeys } from "../queries/keys.js";

type BlockApi = ReturnType<typeof createBlockApi>;

export const createBlockMutations = (api: BlockApi, queryClient: QueryClient) => {
  // Blocking/unblocking someone changes whether a DM with them can be sent
  // and whether their existing messages should still render, so every
  // conversation-related cache needs a broad refresh alongside the blocked
  // users list itself.
  const invalidateAfterBlockChange = () => {
    queryClient.invalidateQueries({ queryKey: blockKeys.blockedUsers() });
    queryClient.invalidateQueries({ queryKey: conversationKeys.userConversationsAll() });
    queryClient.invalidateQueries({ queryKey: conversationKeys.archivedAll() });
    queryClient.invalidateQueries({ queryKey: ["conversation_messages"] });
  };

  return {
    block: () =>
      mutationOptions({
        mutationFn: (userId: string) => api.block(userId),
        onSuccess: invalidateAfterBlockChange,
      }),

    unblock: () =>
      mutationOptions({
        mutationFn: (userId: string) => api.unblock(userId),
        onSuccess: invalidateAfterBlockChange,
      }),
  };
};
