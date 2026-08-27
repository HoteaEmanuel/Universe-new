import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useGroupStore } from "../../store/groupStore";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import type {
  ChatMessage,
  ChatMessagePage,
  GroupVisibility,
  NewCourseResourcePayload,
  NewFilesMessagePayload,
  NewMessagePayload,
  NewPollMessagePayload,
  NewVoiceMessagePayload,
  ResourceCategory,
} from "../../features/chat/types";
import {
  appendOptimisticMessage,
  setReactionInPages,
  updateMessageInPages,
} from "../../features/chat/utils/messagePageCache";

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  const { createGroup } = useGroupStore();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      visibility?: GroupVisibility;
      courseTag?: string;
    }) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast.success("Group created");
    },
  });
};

export const useSetGroupCourseTagMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { setGroupCourseTag } = useGroupStore();
  return useMutation({
    mutationFn: (courseTag: string | null) =>
      setGroupCourseTag(groupId as string, courseTag),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast.success("Course updated");
    },
  });
};

export const useSendMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { sendMessageToGroup } = useGroupStore();
  const { user } = useAuthStore() as { user: { id: string } | null };

  return useMutation({
    mutationFn: (message: NewMessagePayload) =>
      sendMessageToGroup(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
      const queryKey = ["group-messages", groupId];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content: message.messageText || undefined,
        senderId: user?.id ?? "",
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
      if (groupId && context?.previous) {
        queryClient.setQueryData(["group-messages", groupId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
    },
  });
};

export const useSendFilesMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { sendFilesMessageToGroup } = useGroupStore();
  const { user } = useAuthStore() as { user: { id: string } | null };

  return useMutation({
    mutationFn: (message: NewFilesMessagePayload) =>
      sendFilesMessageToGroup(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
      const queryKey = ["group-messages", groupId];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
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
      if (groupId && context?.previous) {
        queryClient.setQueryData(["group-messages", groupId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
    },
  });
};

export const useSendVoiceMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { sendVoiceMessageToGroup } = useGroupStore();
  const { user } = useAuthStore() as { user: { id: string } | null };

  return useMutation({
    mutationFn: (message: NewVoiceMessagePayload) =>
      sendVoiceMessageToGroup(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
      const queryKey = ["group-messages", groupId];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        audioUrl: URL.createObjectURL(message.audio),
        audioDurationSec: message.durationSec,
        senderId: user?.id ?? "",
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
      if (groupId && context?.previous) {
        queryClient.setQueryData(["group-messages", groupId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
    },
  });
};

export const useSendPollMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { sendPollMessageToGroup } = useGroupStore();
  const { user } = useAuthStore() as { user: { id: string } | null };

  return useMutation({
    mutationFn: (message: NewPollMessagePayload) =>
      sendPollMessageToGroup(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
      const queryKey = ["group-messages", groupId];
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        senderId: user?.id ?? "",
        groupId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        poll: {
          id: `optimistic-poll-${Date.now()}`,
          question: message.question,
          authorId: user?.id ?? "",
          closesAt: message.closesAt ?? null,
          closedAt: null,
          status: "open",
          totalVotes: 0,
          options: message.options.map((text, index) => ({
            id: `optimistic-option-${index}`,
            text,
            position: index,
            voteCount: 0,
          })),
        },
      };
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        appendOptimisticMessage(old, optimisticMessage),
      );
      return { previous };
    },
    onError: (_error, _message, context) => {
      if (groupId && context?.previous) {
        queryClient.setQueryData(["group-messages", groupId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["group-messages", groupId] });
    },
  });
};

export const useEditMessageInGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { editMessageInGroup } = useGroupStore();
  const queryKey = ["group-messages", groupId];

  return useMutation({
    mutationFn: ({ id, newContent }: { id: string; newContent: string }) =>
      editMessageInGroup(id, newContent),
    onMutate: async ({ id, newContent }) => {
      if (!groupId) return;
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
      if (groupId && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (groupId) queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useReactToGroupMessageMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { reactToGroupMessage } = useGroupStore();
  const { user } = useAuthStore() as { user: { id: string } | null };
  const queryKey = ["group-messages", groupId];

  return useMutation({
    mutationFn: ({ id, emoji }: { id: string; emoji: string }) =>
      reactToGroupMessage(id, emoji),
    onMutate: async ({ id, emoji }) => {
      if (!groupId || !user) return;
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        setReactionInPages(old, id, user.id, emoji),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (groupId && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (groupId) queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useDeleteMessageInGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { deleteMessageInGroup } = useGroupStore();
  const queryKey = ["group-messages", groupId];

  return useMutation({
    mutationFn: (messageId: string) => deleteMessageInGroup(messageId),
    onMutate: async (messageId) => {
      if (!groupId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous =
        queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
      queryClient.setQueryData<InfiniteData<ChatMessagePage>>(queryKey, (old) =>
        updateMessageInPages(old, messageId, (m) => ({
          ...m,
          deleted: true,
          content: undefined,
          imageUrls: [],
          attachments: [],
        })),
      );
      return { previous };
    },
    onError: (_error, _messageId, context) => {
      if (groupId && context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      if (groupId) queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useAddMemberToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { addMemberToGroup } = useGroupStore();
  return useMutation({
    mutationFn: (userId: string) =>
      addMemberToGroup(groupId as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      queryClient.invalidateQueries({
        queryKey: ["discoverable-public-groups"],
      });
      toast.success("Member added to group");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();
  const { leaveGroup } = useGroupStore();
  return useMutation({
    mutationFn: (groupId: string) => leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast.success("You have left the group");
    },
  });
};

export const usePromoteMemberToAdminMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { makeUserAdmin } = useGroupStore();
  return useMutation({
    mutationFn: (userId: string) =>
      makeUserAdmin(groupId as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      toast.success("Member promoted to admin");
    },
  });
};

export const useBanGroupMemberMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { banGroupMember } = useGroupStore();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      banGroupMember(groupId as string, userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-members", groupId] });
      queryClient.invalidateQueries({ queryKey: ["group-bans", groupId] });
      toast.success("Member removed and banned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUnbanGroupMemberMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { unbanGroupMember } = useGroupStore();
  return useMutation({
    mutationFn: (userId: string) => unbanGroupMember(groupId as string, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-bans", groupId] });
      toast.success("Member unbanned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateGroupImageMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { updateGroupImage } = useGroupStore();
  return useMutation({
    mutationFn: (image: File) => updateGroupImage(groupId as string, image),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      toast.success("Group image updated");
    },
  });
};

export const useAddCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { addCourseResource } = useGroupStore();
  return useMutation({
    mutationFn: (payload: NewCourseResourcePayload) =>
      addCourseResource(groupId as string, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-resources", groupId] });
      toast.success("Resource added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { updateCourseResource } = useGroupStore();
  return useMutation({
    mutationFn: ({
      resourceId,
      ...payload
    }: {
      resourceId: string;
      title?: string;
      description?: string;
      category?: ResourceCategory;
      week?: string;
    }) => updateCourseResource(groupId as string, resourceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-resources", groupId] });
      toast.success("Resource updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { deleteCourseResource } = useGroupStore();
  return useMutation({
    mutationFn: (resourceId: string) =>
      deleteCourseResource(groupId as string, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-resources", groupId] });
      toast.success("Resource deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useToggleCourseResourcePinMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { toggleCourseResourcePin } = useGroupStore();
  return useMutation({
    mutationFn: (resourceId: string) =>
      toggleCourseResourcePin(groupId as string, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-resources", groupId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDownloadCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { downloadCourseResource } = useGroupStore();
  return useMutation({
    mutationFn: (resourceId: string) =>
      downloadCourseResource(groupId as string, resourceId),
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
      queryClient.invalidateQueries({ queryKey: ["course-resources", groupId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useToggleCourseResourceHelpfulMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { toggleCourseResourceHelpful } = useGroupStore();
  return useMutation({
    mutationFn: (resourceId: string) =>
      toggleCourseResourceHelpful(groupId as string, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-resources", groupId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
};
