import { mutationOptions, type InfiniteData, type QueryClient } from "@tanstack/react-query";
import type { createConversationsApi } from "../api/conversations.js";
import type { ChatMessage, ChatMessagePage } from "../chat.js";
import { conversationKeys } from "../queries/keys.js";
import { appendOptimisticMessage, setReactionInPages, updateMessageInPages } from "./messagePageCache.js";

type ConversationsApi = ReturnType<typeof createConversationsApi>;
type MessagesCache = InfiniteData<ChatMessagePage>;

// Toasts and other app-local side effects are composed at the call site;
// these factories own only mutationFn + optimistic cache updates +
// invalidation. `senderId`/`userId` are closed over (like `authorId` in
// mutations/comments.ts) rather than read from an auth store here, since
// packages/shared has no access to app-local state.
//
// `sendFilesMessage`/`sendVoiceMessage` are deliberately NOT here, for the
// same reason as the identical omission in mutations/groups.ts: their
// optimistic preview needs real DOM `File`/`Blob` metadata
// (`file.name`/`size`/`type`, `URL.createObjectURL`), which a DOM-free
// generic `<TFile>` can't touch. Only their network call is shared; the
// optimistic mutation stays app-local in
// frontend/src/queryAndMutation/mutations/conversation-mutation.ts.
export const createConversationMutations = (api: ConversationsApi, queryClient: QueryClient) => ({
  sendMessage: <TFile>(conversationId?: string, senderId?: string) => {
    const queryKey = conversationKeys.messages(conversationId ?? "");
    return mutationOptions({
      mutationFn: (message: { messageText: string; images?: TFile[] }) =>
        api.sendMessage(conversationId as string, message),
      onMutate: async (message) => {
        if (!conversationId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        const optimisticMessage: ChatMessage = {
          id: `optimistic-${Date.now()}`,
          content: message.messageText || undefined,
          senderId: senderId ?? "",
          conversationId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
          appendOptimisticMessage(old, optimisticMessage),
        );
        return { previous };
      },
      onError: (_error, _message, context) => {
        if (conversationId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  deleteMessage: (conversationId?: string) => {
    const queryKey = conversationKeys.messages(conversationId ?? "");
    return mutationOptions({
      mutationFn: (messageId: string) => api.deleteMessage(messageId),
      onMutate: async (messageId) => {
        if (!conversationId) return;
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
        if (conversationId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        if (conversationId) queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  reactToMessage: (conversationId?: string, userId?: string) => {
    const queryKey = conversationKeys.messages(conversationId ?? "");
    return mutationOptions({
      mutationFn: ({ id, emoji }: { id: string; emoji: string }) => api.reactToMessage(id, emoji),
      onMutate: async ({ id, emoji }) => {
        if (!conversationId || !userId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
          setReactionInPages(old, id, userId, emoji),
        );
        return { previous };
      },
      onError: (_error, _vars, context) => {
        if (conversationId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        if (conversationId) queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  editMessage: (conversationId?: string) => {
    const queryKey = conversationKeys.messages(conversationId ?? "");
    return mutationOptions({
      mutationFn: ({ id, newContent }: { id: string; newContent: string }) =>
        api.editMessage(id, newContent),
      onMutate: async ({ id, newContent }) => {
        if (!conversationId) return;
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<MessagesCache>(queryKey);
        queryClient.setQueryData<MessagesCache>(queryKey, (old) =>
          updateMessageInPages(old, id, (m) => ({ ...m, content: newContent, edited: true })),
        );
        return { previous };
      },
      onError: (_error, _vars, context) => {
        if (conversationId && context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => {
        if (conversationId) queryClient.invalidateQueries({ queryKey });
      },
    });
  },

  markRead: (conversationId?: string) =>
    mutationOptions({
      mutationFn: () => api.markRead(conversationId as string),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: conversationKeys.userConversationsAll() });
      },
    }),

  archive: () =>
    mutationOptions({
      mutationFn: (conversationId: string) => api.archive(conversationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: conversationKeys.userConversationsAll() });
        queryClient.invalidateQueries({ queryKey: conversationKeys.archivedAll() });
      },
    }),

  unarchive: () =>
    mutationOptions({
      mutationFn: (conversationId: string) => api.unarchive(conversationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: conversationKeys.userConversationsAll() });
        queryClient.invalidateQueries({ queryKey: conversationKeys.archivedAll() });
      },
    }),

  deleteForMe: () =>
    mutationOptions({
      mutationFn: (conversationId: string) => api.deleteForMe(conversationId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: conversationKeys.userConversationsAll() });
        queryClient.invalidateQueries({ queryKey: conversationKeys.archivedAll() });
      },
    }),

  start: () =>
    mutationOptions({
      mutationFn: ({ userId, message }: { userId: string; message: string }) =>
        api.start(userId, message),
      onSuccess: (_conversationId, variables) => {
        queryClient.invalidateQueries({ queryKey: conversationKeys.userConversationsAll() });
        queryClient.invalidateQueries({ queryKey: conversationKeys.byUsersIds(variables.userId) });
      },
    }),
});
