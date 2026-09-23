import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createConversationsApi } from "@universe/shared/api";
import { createConversationMutations, appendOptimisticMessage } from "@universe/shared/mutations";
import { conversationKeys } from "@universe/shared/queries";
import type { ChatMessage, ChatMessagePage } from "@universe/shared";
import { useAuthStore } from "@store/authStore";
import type { RNFile } from "@utils/chatFile";
import { httpClient } from "../../lib/http";

const conversationsApi = createConversationsApi(httpClient);

export const useSendMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation(
    createConversationMutations(conversationsApi, queryClient).sendMessage<RNFile>(
      conversationId,
      userId,
    ),
  );
};


export const useSendFilesMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const queryKey = conversationKeys.messages(conversationId ?? "");

  return useMutation({
    mutationFn: (message: { messageText: string; files: RNFile[] }) =>
      conversationsApi.sendFilesMessage<RNFile>(conversationId as string, message),
    onMutate: async (message) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content: message.messageText || undefined,
        attachments: message.files.map((file, index) => ({
          id: `optimistic-file-${index}`,
          fileUrl: file.uri,
          fileName: file.name,
          fileSize: file.size ?? 0,
          mimeType: file.type,
        })),
        senderId: userId ?? "",
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
      if (conversationId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      if (conversationId) queryClient.invalidateQueries({ queryKey });
    },
  });
};


export const useStartConversationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createConversationMutations(conversationsApi, queryClient).start());
};

export const useMarkConversationReadMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    createConversationMutations(conversationsApi, queryClient).markRead(conversationId),
  );
};


export const useSendVoiceMessageMutation = (conversationId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const queryKey = conversationKeys.messages(conversationId ?? "");

  return useMutation({
    mutationFn: (message: { audio: RNFile; durationSec: number }) =>
      conversationsApi.sendVoiceMessage<RNFile>(conversationId as string, message),
    onMutate: async (message) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        audioUrl: message.audio.uri,
        audioDurationSec: message.durationSec,
        senderId: userId ?? "",
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
      if (conversationId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      if (conversationId) queryClient.invalidateQueries({ queryKey });
    },
  });
};
