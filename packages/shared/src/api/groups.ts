import type {
  ChatMessage,
  ChatMessagePage,
  CourseResource,
  CourseResourcePage,
  GroupBanPage,
  GroupConversation,
  GroupConversationsPage,
  GroupMember,
  GroupMemberPage,
  NewCourseResourcePayload,
  NewFilesMessagePayload,
  NewMessagePayload,
  NewVoiceMessagePayload,
  ResourceType,
} from "../chat.js";
import type { GroupVisibility, ResourceCategory } from "../domain.js";
import type { CursorPage } from "../pagination.js";
import type { NewPollMessagePayload } from "../poll.js";
import type { ChatUser, MentionUser } from "../user.js";
import type { HttpClient } from "./client.js";

type GroupListParams = { cursor?: string; search?: string };

export const createGroupsApi = (client: HttpClient) => ({
  create: async (data: {
    name: string;
    description?: string;
    visibility?: GroupVisibility;
    courseTag?: string;
  }) => (await client.post<{ group: GroupConversation }>("/groups", data)).group,

  listForUser: async (userId: string, { cursor, search }: GroupListParams = {}) => {
    const response = await client.get<{
      groups: GroupConversation[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/groups/user/${userId}`, {
      ...(cursor ? { cursor } : {}),
      ...(search ? { search } : {}),
    });
    return response satisfies GroupConversationsPage;
  },

  listDiscoverablePublic: async (
    courseTag?: string,
    universityOnly?: boolean,
    limit?: number,
  ) =>
    (
      await client.get<{ groups: GroupConversation[] }>("/groups/discover/public", {
        ...(courseTag ? { courseTag } : {}),
        ...(universityOnly ? { universityOnly } : {}),
        ...(limit ? { limit } : {}),
      })
    ).groups,

  getCourseCatalog: async (groupId?: string) =>
    (await client.get<{ courses: string[] }>("/groups/course-catalog", groupId ? { groupId } : undefined))
      .courses,

  setCourseTag: async (groupId: string, courseTag: string | null) =>
    (await client.patch<{ group: GroupConversation }>(`/groups/${groupId}/course-tag`, { courseTag }))
      .group,

  get: async (id: string) => (await client.get<{ group: GroupConversation }>(`/groups/${id}`)).group,

  listMessages: async (id: string, cursor?: string) => {
    const response = await client.get<{
      groupMessages: ChatMessage[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(`/groups/${id}/messages`, cursor ? { cursor } : undefined);
    return {
      messages: response.groupMessages,
      nextCursor: response.nextCursor,
      hasMore: response.hasMore,
    } satisfies ChatMessagePage;
  },

  listResources: <T>(id: string, type: ResourceType, before?: string) =>
    client.get<CursorPage<T>>(`/groups/${id}/media`, { type, ...(before ? { before } : {}) }),

  // The original code set a `multipart/form-data` header while posting a
  // plain object as the body (no real `FormData`) - the backend route
  // (`imageUpload.any()`) requires an actually-encoded multipart body to
  // parse `messageText`/`images`, so any message sent with images attached
  // was silently malformed. Fixed by building real form data, same as
  // `sendFilesMessage` below already did correctly.
  sendMessage: <TFile>(id: string, message: NewMessagePayload<TFile>) => {
    const form = client.createForm();
    form.append("messageText", message.messageText);
    message.images?.forEach((image) => form.append("images", image));
    return client.postForm<ChatMessage>(`/groups/${id}/send-message`, form);
  },

  sendFilesMessage: <TFile>(id: string, message: NewFilesMessagePayload<TFile>) => {
    const form = client.createForm();
    form.append("messageText", message.messageText);
    message.files.forEach((file) => form.append("files", file));
    return client.postForm<ChatMessage>(`/groups/${id}/send-files-message`, form);
  },

  sendVoiceMessage: <TAudio>(id: string, message: NewVoiceMessagePayload<TAudio>) => {
    const form = client.createForm();
    form.append("audio", message.audio);
    form.append("durationSec", String(message.durationSec));
    return client.postForm<ChatMessage>(`/groups/${id}/send-voice-message`, form);
  },

  sendPollMessage: (id: string, message: NewPollMessagePayload) =>
    client.post<ChatMessage>(`/groups/${id}/send-poll-message`, message),

  // Original unwrapped `response.data.message`, but the backend responds
  // with `{ editedMessage }` - that read always resolved to `undefined`.
  // Not visibly broken (the optimistic mutation never reads the resolved
  // value, and `onSettled` just refetches), but fixed to the real shape.
  editMessage: async (messageId: string, content: string) =>
    (await client.patch<{ editedMessage: ChatMessage }>(`/groups/edit-message/${messageId}`, { content }))
      .editedMessage,

  deleteMessage: (messageId: string) =>
    client.post<{ message: string }>(`/groups/delete-message/${messageId}`),

  reactToMessage: (messageId: string, emoji: string) =>
    client.post<{ removed: boolean }>(`/groups/react-message/${messageId}`, { emoji }),

  checkUserIsAdmin: async (groupId: string, userId: string) =>
    (await client.get<{ isAdmin: boolean }>(`/groups/${groupId}/check-admin/${userId}`)).isAdmin,

  addMember: (groupId: string, userId: string) =>
    client.post<unknown>(`/groups/${groupId}/add-member`, { userId }),

  listMembers: async (groupId: string) =>
    (await client.get<{ members: GroupMember[] }>(`/groups/${groupId}/members`)).members,

  listMembersPage: (groupId: string, cursor?: string, search?: string) =>
    client.get<GroupMemberPage>(`/groups/${groupId}/members/page`, { cursor, search }),

  getMemberById: async (groupId: string) =>
    (await client.get<{ member: GroupMember }>(`/groups/${groupId}/auth-user`)).member,

  listUsersFromSameUniversityNotInGroup: async (groupId: string) =>
    (
      await client.get<{ users: ChatUser[] }>(
        `/groups/${groupId}/users-from-same-university-not-in-group`,
      )
    ).users,

  leave: async (groupId: string) =>
    (await client.post<{ message: string }>(`/groups/${groupId}/leave-group`)).message,

  makeAdmin: (groupId: string, userId: string) =>
    client.post<unknown>(`/groups/${groupId}/make-admin/${userId}`),

  banMember: (groupId: string, userId: string, reason?: string) =>
    client.post<{ message: string }>(`/groups/${groupId}/members/${userId}/ban`, { reason }),

  unbanMember: (groupId: string, userId: string) =>
    client.delete<{ message: string }>(`/groups/${groupId}/bans/${userId}`),

  listBans: (groupId: string, cursor?: string) =>
    client.get<GroupBanPage>(`/groups/${groupId}/bans`, cursor ? { cursor } : undefined),

  updateImage: <TFile>(groupId: string, image: TFile) => {
    const form = client.createForm();
    form.append("image", image);
    return client.postForm<unknown>(`/groups/${groupId}/change-group-image`, form);
  },

  listActiveMembers: async (id: string) =>
    (await client.get<{ activeUsers: ChatUser[] }>(`/groups/active-users/${id}`)).activeUsers,

  mentionSearchUsers: async (groupId: string, query: string) =>
    (await client.get<{ users: MentionUser[] }>(`/groups/${groupId}/mention-search`, { q: query })).users,

  listCourseResources: (
    groupId: string,
    params?: { cursor?: string; category?: ResourceCategory; search?: string; week?: string },
  ) => client.get<CourseResourcePage>(`/groups/${groupId}/resources`, params),

  addCourseResource: <TFile>(groupId: string, payload: NewCourseResourcePayload<TFile>) => {
    const form = client.createForm();
    form.append("title", payload.title);
    form.append("category", payload.category);
    if (payload.description) form.append("description", payload.description);
    if (payload.week) form.append("week", payload.week);
    if (payload.linkUrl) form.append("linkUrl", payload.linkUrl);
    if (payload.file) form.append("file", payload.file);
    return client.postForm<CourseResource>(`/groups/${groupId}/resources`, form);
  },

  updateCourseResource: (
    groupId: string,
    resourceId: string,
    payload: Partial<Pick<NewCourseResourcePayload, "title" | "description" | "category" | "week">>,
  ) => client.patch<CourseResource>(`/groups/${groupId}/resources/${resourceId}`, payload),

  deleteCourseResource: (groupId: string, resourceId: string) =>
    client.delete<{ message: string }>(`/groups/${groupId}/resources/${resourceId}`),

  toggleCourseResourcePin: (groupId: string, resourceId: string) =>
    client.post<CourseResource>(`/groups/${groupId}/resources/${resourceId}/pin`),

  downloadCourseResource: (groupId: string, resourceId: string) =>
    client.post<{ url: string | null }>(`/groups/${groupId}/resources/${resourceId}/download`),

  toggleCourseResourceHelpful: (groupId: string, resourceId: string) =>
    client.post<{ helpful: boolean }>(`/groups/${groupId}/resources/${resourceId}/helpful`),
});
