import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createConversationsApi } from "@universe/shared/api";
import { createConversationMutations } from "@universe/shared/mutations";
import { useAuthStore } from "@store/authStore";
import { httpClient } from "../../lib/http";

const conversationsApi = createConversationsApi(httpClient);

// Mirrors frontend/src/queryAndMutation/mutations/conversation-mutation.ts'
// useSendMessageMutation. Only the text-send path is ported for now — mobile
// has no image/file/voice attachment UI yet, so those sibling hooks
// (useSendFilesMessageMutation etc.) stay web-only until that's built.
// `<never>` for the shared factory's `TFile` generic since this hook never
// passes `images`.
export const useSendMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation(
    createConversationMutations(conversationsApi, queryClient).sendMessage<never>(
      conversationId,
      userId,
    ),
  );
};
