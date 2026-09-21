import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { toast } from "sonner";
import { createConversationsApi } from "@universe/shared/api";
import { createConversationMutations } from "@universe/shared/mutations";
import { useAuthStore } from "../../store/authStore";
import type { ChatMessage, ChatMessagePage, NewFilesMessagePayload, NewVoiceMessagePayload } from "../../features/chat/types";
import { appendOptimisticMessage } from "@universe/shared/mutations";
import { httpClient } from "@/lib/api";

const conversationsApi = createConversationsApi(httpClient);

export const useSendMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  return useMutation(
    createConversationMutations(conversationsApi, queryClient).sendMessage<File>(conversationId, user?.id),
  );
};

// Kept app-local rather than in the shared `createConversationMutations`
// factory: the optimistic preview needs real DOM `File` metadata
// (`file.name`/`size`/`type`, `URL.createObjectURL`), which the DOM-free
// shared package can't touch generically - same rationale as groups'
// identical split in group-mutation.ts. The network call itself
// (`conversationsApi.sendFilesMessage`) still goes through the shared api
// layer.
export const useSendFilesMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  const queryKey = ["conversation_messages", conversationId];

  return useMutation({
    mutationFn: (message: NewFilesMessagePayload) =>
      conversationsApi.sendFilesMessage<File>(conversationId as string, message),
    onMutate: async (message) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content: message.messageText || undefined,
        attachments: message.files.map((file, index) => ({
          id: `optimistic-file-${index}`,
          fileUrl: URL.createObjectURL(file),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        })),
        senderId: user?.id ?? "",
        conversationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        appendOptimisticMessage(old, optimisticMessage),
      );
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (conversationId && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

// Same rationale as `useSendFilesMessageMutation` above - the optimistic
// preview needs a real DOM `Blob` (`URL.createObjectURL`).
export const useSendVoiceMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  const queryKey = ["conversation_messages", conversationId];

  return useMutation({
    mutationFn: (message: NewVoiceMessagePayload) =>
      conversationsApi.sendVoiceMessage<Blob>(conversationId as string, message),
    onMutate: async (message) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        audioUrl: URL.createObjectURL(message.audio),
        audioDurationSec: message.durationSec,
        senderId: user?.id ?? "",
        conversationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        appendOptimisticMessage(old, optimisticMessage),
      );
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (conversationId && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useMarkConversationReadMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createConversationMutations(conversationsApi, queryClient).markRead(conversationId));
};

export const useArchiveConversationMutation = () => {
  const queryClient = useQueryClient();
  const shared = createConversationMutations(conversationsApi, queryClient).archive();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Conversation archived");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUnarchiveConversationMutation = () => {
  const queryClient = useQueryClient();
  const shared = createConversationMutations(conversationsApi, queryClient).unarchive();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Conversation unarchived");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteConversationMutation = () => {
  const queryClient = useQueryClient();
  const shared = createConversationMutations(conversationsApi, queryClient).deleteForMe();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Conversation deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useStartConversationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createConversationMutations(conversationsApi, queryClient).start());
};

export const useDeleteMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    createConversationMutations(conversationsApi, queryClient).deleteMessage(conversationId),
  );
};

export const useReactToMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  return useMutation(
    createConversationMutations(conversationsApi, queryClient).reactToMessage(conversationId, user?.id),
  );
};

export const useEditMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    createConversationMutations(conversationsApi, queryClient).editMessage(conversationId),
  );
};
