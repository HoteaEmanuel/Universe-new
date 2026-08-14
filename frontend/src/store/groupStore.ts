import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type {
  ChatMediaPage,
  ChatMessage,
  ChatMessagePage,
  ChatUser,
  GroupConversation,
  GroupMember,
  GroupVisibility,
} from "../features/chat/types";

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
  }) => Promise<GroupConversation>;
  getUserGroups: (userId: string) => Promise<GroupConversation[]>;
  getDiscoverablePublicGroups: () => Promise<GroupConversation[]>;
  getGroupById: (id: string) => Promise<GroupConversation>;
  getGroupMessages: (id: string, cursor?: string) => Promise<ChatMessagePage>;
  getGroupMedia: (id: string, before?: string) => Promise<ChatMediaPage>;
  sendMessageToGroup: (
    id: string,
    message: Record<string, unknown>,
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
  updateGroupImage: (groupId: string, image: File) => Promise<unknown>;
  getActiveMembers: (id: string) => Promise<ChatUser[]>;
};

export const useGroupStore = create<GroupStore>(() => ({
  createGroup: async ({ name, description, visibility }) => {
    try {
      const response = await axios.post(`${API_URL}/groups`, {
        name,
        description,
        visibility,
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
  getDiscoverablePublicGroups: async () => {
    try {
      const response = await axios.get(`${API_URL}/groups/discover/public`);
      return response.data.groups;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load groups"));
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
  getGroupMedia: async (id, before) => {
    try {
      const response = await axios.get(`${API_URL}/groups/${id}/media`, {
        params: before ? { before } : undefined,
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
}));
