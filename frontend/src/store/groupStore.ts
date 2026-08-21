import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type {
  ChatFilePage,
  ChatMediaPage,
  ChatMessage,
  ChatMessagePage,
  ChatUser,
  GroupBanPage,
  GroupConversation,
  GroupMember,
  GroupVisibility,
  NewFilesMessagePayload,
  NewPollMessagePayload,
  NewVoiceMessagePayload,
  ResourceType,
} from "../features/chat/types";
import type { MentionUser } from "../queryAndMutation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
  fallback;

type GroupStore = {
  createGroup: (data: {
    name: string;
    description?: string;
    visibility?: GroupVisibility;
    courseTag?: string;
  }) => Promise<GroupConversation>;
  getUserGroups: (userId: string) => Promise<GroupConversation[]>;
  getDiscoverablePublicGroups: (courseTag?: string) => Promise<GroupConversation[]>;
  getCourseCatalog: (groupId?: string) => Promise<string[]>;
  setGroupCourseTag: (groupId: string, courseTag: string | null) => Promise<GroupConversation>;
  getGroupById: (id: string) => Promise<GroupConversation>;
  getGroupMessages: (id: string, cursor?: string) => Promise<ChatMessagePage>;
  getGroupResources: (
    id: string,
    type: ResourceType,
    before?: string,
  ) => Promise<ChatMediaPage | ChatFilePage>;
  sendMessageToGroup: (
    id: string,
    message: Record<string, unknown>,
  ) => Promise<ChatMessage>;
  sendFilesMessageToGroup: (
    id: string,
    message: NewFilesMessagePayload,
  ) => Promise<ChatMessage>;
  sendVoiceMessageToGroup: (
    id: string,
    message: NewVoiceMessagePayload,
  ) => Promise<ChatMessage>;
  sendPollMessageToGroup: (
    id: string,
    message: NewPollMessagePayload,
  ) => Promise<ChatMessage>;
  editMessageInGroup: (messageId: string, content: string) => Promise<ChatMessage>;
  deleteMessageInGroup: (messageId: string) => Promise<{ message: string }>;
  reactToGroupMessage: (
    messageId: string,
    emoji: string,
  ) => Promise<{ removed: boolean }>;
  checkUserIsAdmin: (groupId: string, userId: string) => Promise<boolean>;
  addMemberToGroup: (groupId: string, userId: string) => Promise<unknown>;
  getGroupMembers: (groupId: string) => Promise<GroupMember[]>;
  getGroupMemberById: (groupId: string) => Promise<GroupMember>;
  getUsersFromSameUniversityNotInGroup: (groupId: string) => Promise<ChatUser[]>;
  leaveGroup: (groupId: string) => Promise<{ message: string }>;
  makeUserAdmin: (groupId: string, userId: string) => Promise<unknown>;
  banGroupMember: (
    groupId: string,
    userId: string,
    reason?: string,
  ) => Promise<{ message: string }>;
  unbanGroupMember: (groupId: string, userId: string) => Promise<{ message: string }>;
  getGroupBans: (groupId: string, cursor?: string) => Promise<GroupBanPage>;
  updateGroupImage: (groupId: string, image: File) => Promise<unknown>;
  getActiveMembers: (id: string) => Promise<ChatUser[]>;
  getGroupMentionSearchUsers: (groupId: string, query: string) => Promise<MentionUser[]>;
};

export const useGroupStore = create<GroupStore>(() => ({
  createGroup: async ({ name, description, visibility, courseTag }) => {
    try {
      const response = await axios.post(`${API_URL}/groups`, {
        name,
        description,
        visibility,
        courseTag,
      });
      return response.data.group;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not create group"));
    }
  },
  getUserGroups: async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/groups/user/${userId}`);
      return response.data.groups;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load groups"));
    }
  },
  getDiscoverablePublicGroups: async (courseTag) => {
    try {
      const response = await axios.get(`${API_URL}/groups/discover/public`, {
        params: courseTag ? { courseTag } : undefined,
      });
      return response.data.groups;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load groups"));
    }
  },
  getCourseCatalog: async (groupId) => {
    try {
      const response = await axios.get(`${API_URL}/groups/course-catalog`, {
        params: groupId ? { groupId } : undefined,
      });
      return response.data.courses;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load course catalog"));
    }
  },
  setGroupCourseTag: async (groupId, courseTag) => {
    try {
      const response = await axios.patch(
        `${API_URL}/groups/${groupId}/course-tag`,
        { courseTag },
      );
      return response.data.group;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not update course tag"));
    }
  },
  getGroupById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/groups/${id}`);
      return response.data.group;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load group"));
    }
  },
  getGroupMessages: async (id, cursor) => {
    try {
      const response = await axios.get(`${API_URL}/groups/${id}/messages`, {
        params: cursor ? { cursor } : undefined,
      });
      return {
        messages: response.data.groupMessages,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load messages"));
    }
  },
  getGroupResources: async (id, type, before) => {
    try {
      const response = await axios.get(`${API_URL}/groups/${id}/media`, {
        params: { type, ...(before ? { before } : {}) },
      });
      return {
        items: response.data.items,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load media"));
    }
  },
  sendMessageToGroup: async (id, message) => {
    try {
      const response = await axios.post(
        `${API_URL}/groups/${id}/send-message`,
        message,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not send message"));
    }
  },
  sendFilesMessageToGroup: async (id, { messageText, files }) => {
    try {
      const formData = new FormData();
      formData.append("messageText", messageText);
      files.forEach((file) => formData.append("files", file));
      const response = await axios.post(
        `${API_URL}/groups/${id}/send-files-message`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not send files"));
    }
  },
  sendVoiceMessageToGroup: async (id, { audio, durationSec }) => {
    try {
      const formData = new FormData();
      formData.append("audio", audio);
      formData.append("durationSec", String(durationSec));
      const response = await axios.post(
        `${API_URL}/groups/${id}/send-voice-message`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not send voice message"));
    }
  },
  sendPollMessageToGroup: async (id, { question, options, closesAt }) => {
    try {
      const response = await axios.post(`${API_URL}/groups/${id}/send-poll-message`, {
        question,
        options,
        closesAt,
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not send poll"));
    }
  },
  editMessageInGroup: async (messageId, content) => {
    try {
      const response = await axios.patch(
        `${API_URL}/groups/edit-message/${messageId}`,
        { content },
      );
      return response.data.message;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not edit message"));
    }
  },
  deleteMessageInGroup: async (messageId) => {
    try {
      const response = await axios.post(
        `${API_URL}/groups/delete-message/${messageId}`,
      );
      return response.data.message;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not delete message"));
    }
  },
  reactToGroupMessage: async (messageId, emoji) => {
    try {
      const response = await axios.post(
        `${API_URL}/groups/react-message/${messageId}`,
        { emoji },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not react to message"));
    }
  },
  checkUserIsAdmin: async (groupId, userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/check-admin/${userId}`,
      );
      return response.data.isAdmin;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not check admin status"));
    }
  },
  addMemberToGroup: async (groupId, userId) => {
    try {
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/add-member`,
        { userId },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not add member"));
    }
  },
  getGroupMembers: async (groupId) => {
    try {
      const response = await axios.get(`${API_URL}/groups/${groupId}/members`);
      return response.data.members;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load members"));
    }
  },
  getGroupMemberById: async (groupId) => {
    try {
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/auth-user`,
      );
      return response.data.member;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load membership"));
    }
  },
  getUsersFromSameUniversityNotInGroup: async (groupId) => {
    try {
      const response = await axios.get(
        `${API_URL}/groups/${groupId}/users-from-same-university-not-in-group`,
      );
      return response.data.users;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load university users"));
    }
  },
  leaveGroup: async (groupId) => {
    try {
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/leave-group`,
      );
      return response.data.message;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not leave group"));
    }
  },
  makeUserAdmin: async (groupId, userId) => {
    try {
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/make-admin/${userId}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not update admin"));
    }
  },
  banGroupMember: async (groupId, userId, reason) => {
    try {
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/members/${userId}/ban`,
        { reason },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not ban member"));
    }
  },
  unbanGroupMember: async (groupId, userId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/groups/${groupId}/bans/${userId}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not unban member"));
    }
  },
  getGroupBans: async (groupId, cursor) => {
    try {
      const response = await axios.get(`${API_URL}/groups/${groupId}/bans`, {
        params: cursor ? { cursor } : undefined,
      });
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load banned users"));
    }
  },
  updateGroupImage: async (groupId, image) => {
    try {
      const formData = new FormData();
      formData.append("image", image);
      const response = await axios.post(
        `${API_URL}/groups/${groupId}/change-group-image`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not update group image"));
    }
  },
  getActiveMembers: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/groups/active-users/${id}`);
      return response.data.activeUsers;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load active members"));
    }
  },
  getGroupMentionSearchUsers: async (groupId, query) => {
    try {
      const response = await axios.get(`${API_URL}/groups/${groupId}/mention-search`, {
        params: { q: query },
      });
      return response.data.users;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not search group members"));
    }
  },
}));
