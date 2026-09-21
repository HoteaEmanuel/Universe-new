import { mutationOptions, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import type { createGroupsApi } from "../api/groups.js";
import type { ChatMessage, ChatMessagePage, NewCourseResourcePayload } from "../chat.js";
import type { GroupVisibility, ResourceCategory } from "../domain.js";
import type { NewPollMessagePayload } from "../poll.js";
import { groupKeys } from "../queries/keys.js";
import { appendOptimisticMessage, setReactionInPages, updateMessageInPages } from "./messagePageCache.js";

type GroupsApi = ReturnType<typeof createGroupsApi>;
type MessagesCache = InfiniteData<ChatMessagePage>;

// Toasts, `window.open`, and other app-local side effects are composed at
// the call site; these factories own only mutationFn + optimistic cache
// updates + invalidation. `groupId`/sender-or-user id are closed over
// (like `authorId` in mutations/comments.ts) rather than read from an auth
// store here, since packages/shared has no access to app-local state.
//
// `sendFilesMessage`/`sendVoiceMessage` are deliberately NOT here: their
// optimistic preview needs real DOM `File`/`Blob` metadata
// (`file.name`/`size`/`type`, `URL.createObjectURL`), which a DOM-free
// generic `<TFile>` can't touch. Only their network call
// (`api.sendFilesMessage`/`api.sendVoiceMessage`) is shared; the optimistic
// mutation stays app-local in frontend/src/queryAndMutation/mutations/group-mutation.ts.
export const createGroupMutations = (api: GroupsApi, queryClient: QueryClient) => ({
  create: () =>
    mutationOptions({
      mutationFn: (data: {
        name: string;
        description?: string;
        visibility?: GroupVisibility;
        courseTag?: string;
      }) => api.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.userGroupsAll() });
      },
    }),

  setCourseTag: (groupId?: string) =>
    mutationOptions({
      mutationFn: (courseTag: string | null) => api.setCourseTag(groupId as string, courseTag),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId ?? "") });
        queryClient.invalidateQueries({ queryKey: groupKeys.userGroupsAll() });
      },
    }),

  sendMessage: <TFile>(groupId?: string, senderId?: string) => {
    const queryKey = groupKeys.messages(groupId ?? "");
    return mutationOptions({
      mutationFn: (message: { messageText: string; images?: TFile[] }) =>
        api.sendMessage(groupId as string, message),
      onMutate: async (message) => {
        if (!groupId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        const optimisticMessage: ChatMessage = {
          id: `optimistic-${Date.now()}`,
          content: message.messageText || undefined,
          senderId: senderId ?? "",
          groupId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
          appendOptimisticMessage(old, optimisticMessage),
        );
        return { previous };
      },
      onError: (_error, _message, context) => {
        if (groupId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  sendPollMessage: (groupId?: string, senderId?: string) => {
    const queryKey = groupKeys.messages(groupId ?? "");
    return mutationOptions({
      mutationFn: (message: NewPollMessagePayload) => api.sendPollMessage(groupId as string, message),
      onMutate: async (message) => {
        if (!groupId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        const optimisticMessage: ChatMessage = {
          id: `optimistic-${Date.now()}`,
          senderId: senderId ?? "",
          groupId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          poll: {
            id: `optimistic-poll-${Date.now()}`,
            question: message.question,
            authorId: senderId ?? "",
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
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
          appendOptimisticMessage(old, optimisticMessage),
        );
        return { previous };
      },
      onError: (_error, _message, context) => {
        if (groupId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  editMessage: (groupId?: string) => {
    const queryKey = groupKeys.messages(groupId ?? "");
    return mutationOptions({
      mutationFn: ({ id, newContent }: { id: string; newContent: string }) =>
        api.editMessage(id, newContent),
      onMutate: async ({ id, newContent }) => {
        if (!groupId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
          updateMessageInPages(old, id, (m) => ({ ...m, content: newContent, edited: true })),
        );
        return { previous };
      },
      onError: (_error, _vars, context) => {
        if (groupId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        if (groupId) queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  reactToMessage: (groupId?: string, userId?: string) => {
    const queryKey = groupKeys.messages(groupId ?? "");
    return mutationOptions({
      mutationFn: ({ id, emoji }: { id: string; emoji: string }) => api.reactToMessage(id, emoji),
      onMutate: async ({ id, emoji }) => {
        if (!groupId || !userId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
          setReactionInPages(old, id, userId, emoji),
        );
        return { previous };
      },
      onError: (_error, _vars, context) => {
        if (groupId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        if (groupId) queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  deleteMessage: (groupId?: string) => {
    const queryKey = groupKeys.messages(groupId ?? "");
    return mutationOptions({
      mutationFn: (messageId: string) => api.deleteMessage(messageId),
      onMutate: async (messageId) => {
        if (!groupId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
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
        if (groupId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        if (groupId) queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  addMember: (groupId?: string) =>
    mutationOptions({
      mutationFn: (userId: string) => api.addMember(groupId as string, userId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId ?? "") });
        queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId ?? "") });
        queryClient.invalidateQueries({ queryKey: groupKeys.userGroupsAll() });
        queryClient.invalidateQueries({ queryKey: groupKeys.discoverablePublicAll() });
      },
    }),

  leave: () =>
    mutationOptions({
      mutationFn: (groupId: string) => api.leave(groupId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.userGroupsAll() });
      },
    }),

  promoteToAdmin: (groupId?: string) =>
    mutationOptions({
      mutationFn: (userId: string) => api.makeAdmin(groupId as string, userId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId ?? "") });
        queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId ?? "") });
      },
    }),

  banMember: (groupId?: string) =>
    mutationOptions({
      mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
        api.banMember(groupId as string, userId, reason),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.members(groupId ?? "") });
        queryClient.invalidateQueries({ queryKey: groupKeys.bans(groupId ?? "") });
      },
    }),

  unbanMember: (groupId?: string) =>
    mutationOptions({
      mutationFn: (userId: string) => api.unbanMember(groupId as string, userId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.bans(groupId ?? "") });
      },
    }),

  updateImage: <TFile>(groupId?: string) =>
    mutationOptions({
      mutationFn: (image: TFile) => api.updateImage(groupId as string, image),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.detail(groupId ?? "") });
      },
    }),

  addCourseResource: <TFile>(groupId?: string) =>
    mutationOptions({
      mutationFn: (payload: NewCourseResourcePayload<TFile>) =>
        api.addCourseResource(groupId as string, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.courseResourcesAll(groupId ?? "") });
      },
    }),

  updateCourseResource: (groupId?: string) =>
    mutationOptions({
      mutationFn: ({
        resourceId,
        ...payload
      }: {
        resourceId: string;
        title?: string;
        description?: string;
        category?: ResourceCategory;
        week?: string;
      }) => api.updateCourseResource(groupId as string, resourceId, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.courseResourcesAll(groupId ?? "") });
      },
    }),

  deleteCourseResource: (groupId?: string) =>
    mutationOptions({
      mutationFn: (resourceId: string) => api.deleteCourseResource(groupId as string, resourceId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.courseResourcesAll(groupId ?? "") });
      },
    }),

  toggleCourseResourcePin: (groupId?: string) =>
    mutationOptions({
      mutationFn: (resourceId: string) => api.toggleCourseResourcePin(groupId as string, resourceId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.courseResourcesAll(groupId ?? "") });
      },
    }),

  downloadCourseResource: (groupId?: string) =>
    mutationOptions({
      mutationFn: (resourceId: string) => api.downloadCourseResource(groupId as string, resourceId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.courseResourcesAll(groupId ?? "") });
      },
    }),

  toggleCourseResourceHelpful: (groupId?: string) =>
    mutationOptions({
      mutationFn: (resourceId: string) =>
        api.toggleCourseResourceHelpful(groupId as string, resourceId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: groupKeys.courseResourcesAll(groupId ?? "") });
      },
    }),
});
