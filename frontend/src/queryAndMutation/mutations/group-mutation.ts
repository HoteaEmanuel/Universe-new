import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGroupStore } from "../../store/groupStore";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import type {
  ChatMessage,
  GroupVisibility,
  NewMessagePayload,
} from "../../features/chat/types";

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  const { createGroup } = useGroupStore();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      visibility?: GroupVisibility;
    }) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-groups"] });
      toast.success("Group created");
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
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKey);
      const optimisticMessage: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        content: message.messageText || undefined,
        senderId: user?.id ?? "",
        groupId,
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
      const previous = queryClient.getQueryData<ChatMessage[]>(queryKey);
      queryClient.setQueryData<ChatMessage[]>(queryKey, (old) =>
        old?.map((m) =>
          m.id === id ? { ...m, content: newContent, edited: true } : m,
        ),
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
