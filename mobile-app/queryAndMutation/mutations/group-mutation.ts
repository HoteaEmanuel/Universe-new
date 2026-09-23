import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroupsApi } from "@universe/shared/api";
import { createGroupMutations } from "@universe/shared/mutations";
import { useAuthStore } from "@store/authStore";
import { httpClient } from "../../lib/http";

const groupsApi = createGroupsApi(httpClient);

// Mirrors frontend/src/queryAndMutation/mutations/group-mutation.ts'
// useSendMessageToGroupMutation — only the text-send path, same rationale as
// the identical scope note in mobile's conversation-mutation.ts.
export const useSendMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation(
    createGroupMutations(groupsApi, queryClient).sendMessage<never>(groupId, userId),
  );
};
