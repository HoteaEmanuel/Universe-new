import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createGroupsApi } from "@universe/shared/api";
import { createGroupMutations, appendOptimisticMessage } from "@universe/shared/mutations";
import { groupKeys } from "@universe/shared/queries";
import type { ChatMessage, ChatMessagePage } from "@universe/shared";
import { useAuthStore } from "@store/authStore";
import type { RNFile } from "@utils/chatFile";
import { httpClient } from "../../lib/http";

const groupsApi = createGroupsApi(httpClient);

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createGroupMutations(groupsApi, queryClient).leave());
};

export const useDeleteGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation(createGroupMutations(groupsApi, queryClient).delete());
};

export const usePromoteToAdminMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createGroupMutations(groupsApi, queryClient).promoteToAdmin(groupId));
};

export const useBanGroupMemberMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createGroupMutations(groupsApi, queryClient).banMember(groupId));
};

export const useSendMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  return useMutation(
    createGroupMutations(groupsApi, queryClient).sendMessage<RNFile>(groupId, userId),
  );
};

export const useSendFilesMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const queryKey = groupKeys.messages(groupId ?? "");

  return useMutation({
    mutationFn: (message: { messageText: string; files: RNFile[] }) =>
      groupsApi.sendFilesMessage<RNFile>(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
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
        groupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        appendOptimisticMessage(old, optimisticMessage),
      );
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (groupId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      if (groupId) queryClient.invalidateQueries({ queryKey });
    },
  });
};


export const useSendVoiceMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const queryKey = groupKeys.messages(groupId ?? "");

  return useMutation({
    mutationFn: (message: { audio: RNFile; durationSec: number }) =>
      groupsApi.sendVoiceMessage<RNFile>(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        audioUrl: message.audio.uri,
        audioDurationSec: message.durationSec,
        senderId: userId ?? "",
        groupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        appendOptimisticMessage(old, optimisticMessage),
      );
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (groupId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      if (groupId) queryClient.invalidateQueries({ queryKey });
    },
  });
};
