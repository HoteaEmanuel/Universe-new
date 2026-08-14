import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useConversationStore } from "../../store/conversationStore";
import { useAuthStore } from "../../store/authStore";
import type {
  ChatMessage,
  ChatMessagePage,
  NewMessagePayload,
} from "../../features/chat/types";
import {
  appendOptimisticMessage,
  setReactionInPages,
  updateMessageInPages,
} from "../../features/chat/utils/messagePageCache";

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
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content: message.messageText || undefined,
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
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        updateMessageInPages(old, messageId, (m) => ({
          ...m,
          deleted: true,
          content: undefined,
          imageUrls: [],
        })),
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

export const useReactToMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const { reactToMessage } = useConversationStore();
  const { user } = useAuthStore() as { user: { id: string } | null };
  const queryKey = ["conversation_messages", conversationId];

  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      reactToMessage(id, emoji),
    onMutate: async ({ id, emoji }) => {
      if (!conversationId || !user) return;
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        setReactionInPages(old, id, user.id, emoji),
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
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        updateMessageInPages(old, id, (m) => ({
          ...m,
          content: newContent,
          edited: true,
        })),
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
