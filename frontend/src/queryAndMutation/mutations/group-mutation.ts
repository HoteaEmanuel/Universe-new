import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createGroupsApi } from "@universe/shared/api";
import { createGroupMutations } from "@universe/shared/mutations";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import type {
  ChatMessage,
  ChatMessagePage,
  NewFilesMessagePayload,
  NewVoiceMessagePayload,
} from "../../features/chat/types";
import { appendOptimisticMessage } from "../../features/chat/utils/messagePageCache";
import { httpClient } from "@/lib/api";

const groupsApi = createGroupsApi(httpClient);

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).create();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Group created");
    },
  });
};

export const useSetGroupCourseTagMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).setCourseTag(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Course updated");
    },
  });
};

export const useSendMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  return useMutation(createGroupMutations(groupsApi, queryClient).sendMessage<File>(groupId, user?.id));
};

// Kept app-local rather than in the shared `createGroupMutations` factory:
// the optimistic preview needs real DOM `File` metadata
// (`file.name`/`size`/`type`, `URL.createObjectURL`), which the DOM-free
// shared package can't touch generically. The network call itself
// (`groupsApi.sendFilesMessage`) still goes through the shared api layer.
export const useSendFilesMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  const queryKey = ["group-messages", groupId];

  return useMutation({
    mutationFn: (message: NewFilesMessagePayload) =>
      groupsApi.sendFilesMessage<File>(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
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
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

// Same rationale as `useSendFilesMessageToGroupMutation` above - the
// optimistic preview needs a real DOM `Blob` (`URL.createObjectURL`).
export const useSendVoiceMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  const queryKey = ["group-messages", groupId];

  return useMutation({
    mutationFn: (message: NewVoiceMessagePayload) =>
      groupsApi.sendVoiceMessage<Blob>(groupId as string, message),
    onMutate: async (message) => {
      if (!groupId) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ChatMessagePage>>(queryKey);
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
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};

export const useSendPollMessageToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  return useMutation(createGroupMutations(groupsApi, queryClient).sendPollMessage(groupId, user?.id));
};

export const useEditMessageInGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createGroupMutations(groupsApi, queryClient).editMessage(groupId));
};

export const useReactToGroupMessageMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore() as { user: { id: string } | null };
  return useMutation(createGroupMutations(groupsApi, queryClient).reactToMessage(groupId, user?.id));
};

export const useDeleteMessageInGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createGroupMutations(groupsApi, queryClient).deleteMessage(groupId));
};

export const useAddMemberToGroupMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).addMember(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Member added to group");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useLeaveGroupMutation = () => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).leave();
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("You have left the group");
    },
  });
};

export const usePromoteMemberToAdminMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).promoteToAdmin(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Member promoted to admin");
    },
  });
};

export const useBanGroupMemberMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).banMember(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Member removed and banned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUnbanGroupMemberMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).unbanMember(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Member unbanned");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateGroupImageMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).updateImage<File>(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Group image updated");
    },
  });
};

export const useAddCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).addCourseResource<File>(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Resource added");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useUpdateCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).updateCourseResource(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Resource updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDeleteCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).deleteCourseResource(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      toast.success("Resource deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useToggleCourseResourcePinMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).toggleCourseResourcePin(groupId);
  return useMutation({
    ...shared,
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useDownloadCourseResourceMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).downloadCourseResource(groupId);
  return useMutation({
    ...shared,
    onSuccess: (data, vars, onMutateResult, context) => {
      shared.onSuccess?.(data, vars, onMutateResult, context);
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: (error: Error) => toast.error(error.message),
  });
};

export const useToggleCourseResourceHelpfulMutation = (groupId?: string) => {
  const queryClient = useQueryClient();
  const shared = createGroupMutations(groupsApi, queryClient).toggleCourseResourceHelpful(groupId);
  return useMutation({
    ...shared,
    onError: (error: Error) => toast.error(error.message),
  });
};
