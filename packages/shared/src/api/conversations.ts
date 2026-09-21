import type {
  ChatMessage,
  ChatMessagePage,
  DirectConversation,
  DirectConversationsPage,
  NewFilesMessagePayload,
  NewMessagePayload,
  NewVoiceMessagePayload,
} from "../chat.js";
import type { CursorPage } from "../pagination.js";
import type { ChatUser } from "../user.js";
import type { HttpClient } from "./client.js";

type ConversationListParams = { cursor?: string; search?: string };
type ResourceType = "images" | "files";

export const createConversationsApi = (client: HttpClient) => ({
  getUserByConvoId: async (id: string) =>
    (await client.get<{ user: ChatUser }>(`/conversations/${id}/user`)).user,

  listMessages: async (id: string, cursor?: string) => {
    const response = await client.get<{
      messages: ChatMessage[];
      nextCursor: string | null;
      hasMore: boolean;
      otherParticipantLastReadAt: string | null;
      canSend: boolean;
      viewerBlockedOther: boolean;
    }>(`/conversations/${id}/messages`, cursor ? { cursor } : undefined);
    return response satisfies ChatMessagePage;
  },

  markRead: (id: string) => client.post<unknown>(`/conversations/${id}/read`),

  listResources: <T>(id: string, type: ResourceType, before?: string) =>
    client.get<CursorPage<T>>(`/conversations/${id}/media`, { type, ...(before ? { before } : {}) }),

  getByUsersIds: async (id: string) =>
    (await client.get<{ conversation: DirectConversation | null }>(`/conversations/user/${id}`))
      .conversation,

  listForUser: async ({ cursor, search }: ConversationListParams = {}) => {
    const response = await client.get<{
      conversations: DirectConversation[];
      nextCursor: string | null;
      hasMore: boolean;
    }>("/conversations", { ...(cursor ? { cursor } : {}), ...(search ? { search } : {}) });
    return response satisfies DirectConversationsPage;
  },

  listArchived: async ({ cursor, search }: ConversationListParams = {}) => {
    const response = await client.get<{
      conversations: DirectConversation[];
      nextCursor: string | null;
      hasMore: boolean;
    }>("/conversations/archived", { ...(cursor ? { cursor } : {}), ...(search ? { search } : {}) });
    return response satisfies DirectConversationsPage;
  },

  archive: (id: string) => client.post<unknown>(`/conversations/${id}/archive`),

  unarchive: (id: string) => client.post<unknown>(`/conversations/${id}/unarchive`),

  deleteForMe: (id: string) => client.delete<unknown>(`/conversations/${id}`),

  listConvoUsers: async () => (await client.get<{ users: ChatUser[] }>("/conversations/users")).users,

  start: async (userId: string, message: string) =>
    (await client.post<{ id: string }>(`/conversations/start-conversation/${userId}`, { message })).id,

  // The original code set a `multipart/form-data` header while posting a
  // plain object as the body (no real `FormData`) - the same bug as
  // groups' `sendMessage` (see packages/shared/src/api/groups.ts), fixed
  // the same way: build real form data, same as `sendFilesMessage` below
  // already did correctly.
  sendMessage: <TFile>(id: string, message: NewMessagePayload<TFile>) => {
    const form = client.createForm();
    form.append("messageText", message.messageText);
    message.images?.forEach((image) => form.append("images", image));
    return client.postForm<ChatMessage>(`/conversations/${id}/send-message`, form);
  },

  sendFilesMessage: <TFile>(id: string, message: NewFilesMessagePayload<TFile>) => {
    const form = client.createForm();
    form.append("messageText", message.messageText);
    message.files.forEach((file) => form.append("files", file));
    return client.postForm<ChatMessage>(`/conversations/${id}/send-files-message`, form);
  },

  sendVoiceMessage: <TAudio>(id: string, message: NewVoiceMessagePayload<TAudio>) => {
    const form = client.createForm();
    form.append("audio", message.audio);
    form.append("durationSec", String(message.durationSec));
    return client.postForm<ChatMessage>(`/conversations/${id}/send-voice-message`, form);
  },

  deleteMessage: (messageId: string) =>
    client.delete<{ message: string }>(`/conversations/delete-messages/${messageId}`),

  // Original declared `Promise<ChatMessage>` and returned the raw response
  // body, but the backend's edit-message route only ever responds with a
  // confirmation string (`{ message: "Message edited successfully" }`), not
  // the edited message - typed accurately here instead of lying about the
  // shape (nothing downstream ever read it as a `ChatMessage`: the
  // optimistic `onMutate` builds its own preview from `newContent`, and
  // `onSettled` just refetches).
  editMessage: (messageId: string, content: string) =>
    client.patch<{ message: string }>(`/conversations/edit-messages/${messageId}`, {
      newContent: content,
    }),

  reactToMessage: (messageId: string, emoji: string) =>
    client.post<{ removed: boolean }>(`/conversations/react-message/${messageId}`, { emoji }),
});
