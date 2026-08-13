import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConversationStore } from "../../store/conversationStore";
import { useAuthStore } from "../../store/authStore";
import type { ChatMessage, NewMessagePayload } from "../../features/chat/types";

export const useSendMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { sendMessage } = useConversationStore();
  const { user } = useAuthStore() as { user: { id: string } | null };

  return useMutation({
    mutationFn: (message: NewMessagePayload) =>
      sendMessage(conversationId as string, message),
    onMutate: async (message) => {
      if (!conversationId) return;
      const queryKey = ["conversation_messages", conversationId];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content: message.messageText || undefined,
        senderId: user?.id ?? "",
        conversationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(queryKey, (old) => [
        ...(old ?? []),
        optimisticMessage,
      ]);
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (conversationId && context?.previous) {
        queryClient.setQueryData(
          ["conversation_messages", conversationId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversation_messages", conversationId],
      });
    },
  });
};

export const useStartConversationMutation = () => {
  const queryClient = useQueryClient();
  const { startConversation } = useConversationStore();
  return useMutation({
    mutationFn: ({ userId, message }: { userId: string; message: string }) =>
      startConversation(userId, message),
    onSuccess: (_conversationId, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversations", variables.userId],
      });
    },
  });
};

export const useDeleteMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { deleteMessage } = useConversationStore();
  const queryKey = ["conversation_messages", conversationId];

  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onMutate: async (messageId) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKey);
      queryClient.setQueryData<ChatMessage[]>(queryKey, (old) =>
        old?.map((m) =>
          m.id === messageId
            ? { ...m, deleted: true, content: undefined, imageUrls: [] }
            : m,
        ),
      );
      return { previous };
    },
    onError: (_error, _messageId, context) => {
      if (conversationId && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (conversationId) queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useEditMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { editMessage } = useConversationStore();
  const queryKey = ["conversation_messages", conversationId];

  return useMutation({
    mutationFn: ({ id, newContent }: { id: string; newContent: string }) =>
      editMessage(id, newContent),
    onMutate: async ({ id, newContent }) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKey);
      queryClient.setQueryData<ChatMessage[]>(queryKey, (old) =>
        old?.map((m) =>
          m.id === id ? { ...m, content: newContent, edited: true } : m,
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (conversationId && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (conversationId) queryClient.invalidateQueries({ queryKey });
    },
  });
};
