import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type {
  ChatFilePage,
  ChatMediaPage,
  ChatMessage,
  ChatMessagePage,
  ChatUser,
  DirectConversation,
  DirectConversationsPage,
  NewFilesMessagePayload,
  NewVoiceMessagePayload,
  ResourceType,
} from "../features/chat/types";

type ConversationListParams = { cursor?: string; search?: string };

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
  fallback;

type ConversationStore = {
  isLoading: boolean;
  error: string | null;
  getUserByConvoId: (id: string) => Promise<ChatUser>;
  getMessages: (id: string, cursor?: string) => Promise<ChatMessagePage>;
  markConversationRead: (id: string) => Promise<void>;
  getConvoResources: (
    id: string,
    type: ResourceType,
    before?: string,
  ) => Promise<ChatMediaPage | ChatFilePage>;
  getConversationByUsersIds: (id: string) => Promise<DirectConversation | null>;
  getUserConversations: (
    params?: ConversationListParams,
  ) => Promise<DirectConversationsPage>;
  getArchivedConversations: (
    params?: ConversationListParams,
  ) => Promise<DirectConversationsPage>;
  archiveConversation: (id: string) => Promise<void>;
  unarchiveConversation: (id: string) => Promise<void>;
  deleteConversationForMe: (id: string) => Promise<void>;
  getConvoUsers: () => Promise<ChatUser[]>;
  startConversation: (id: string, message: string) => Promise<string>;
  sendMessage: (
    id: string,
    message: Record<string, unknown>,
  ) => Promise<ChatMessage>;
  sendFilesMessage: (
    id: string,
    message: NewFilesMessagePayload,
  ) => Promise<ChatMessage>;
  sendVoiceMessage: (
    id: string,
    message: NewVoiceMessagePayload,
  ) => Promise<ChatMessage>;
  deleteMessage: (id: string) => Promise<{ message: string }>;
  editMessage: (id: string, text: string) => Promise<ChatMessage>;
  reactToMessage: (
    id: string,
    emoji: string,
  ) => Promise<{ removed: boolean }>;
};

export const useConversationStore = create<ConversationStore>((set) => ({
  isLoading: false,
  error: null,
  getUserByConvoId: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${id}/user`);
      return response.data.user;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load this conversation"));
    }
  },
  getMessages: async (id, cursor) => {
    try {
      const response = await axios.get(
        `${API_URL}/conversations/${id}/messages`,
        { params: cursor ? { cursor } : undefined },
      );
      return {
        messages: response.data.messages,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
        otherParticipantLastReadAt: response.data.otherParticipantLastReadAt,
        canSend: response.data.canSend,
        viewerBlockedOther: response.data.viewerBlockedOther,
      };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load messages"));
    }
  },
  markConversationRead: async (id) => {
    try {
      await axios.post(`${API_URL}/conversations/${id}/read`);
    } catch (error) {
      throw new Error(errorMessage(error, "Could not mark conversation as read"));
    }
  },
  getConvoResources: async (id, type, before) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${id}/media`, {
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
  getConversationByUsersIds: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/user/${id}`);
      return response.data.conversation;
    } catch (error) {
      throw new Error(
        errorMessage(error, "Could not check for an existing conversation"),
      );
    }
  },
  getUserConversations: async ({ cursor, search } = {}) => {
    try {
      const response = await axios.get(`${API_URL}/conversations`, {
        params: { ...(cursor ? { cursor } : {}), ...(search ? { search } : {}) },
      });
      return {
        conversations: response.data.conversations,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load conversations"));
    }
  },
  getArchivedConversations: async ({ cursor, search } = {}) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/archived`, {
        params: { ...(cursor ? { cursor } : {}), ...(search ? { search } : {}) },
      });
      return {
        conversations: response.data.conversations,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      throw new Error(
        errorMessage(error, "Could not load archived conversations"),
      );
    }
  },
  archiveConversation: async (id) => {
    try {
      await axios.post(`${API_URL}/conversations/${id}/archive`);
    } catch (error) {
      throw new Error(errorMessage(error, "Could not archive conversation"));
    }
  },
  unarchiveConversation: async (id) => {
    try {
      await axios.post(`${API_URL}/conversations/${id}/unarchive`);
    } catch (error) {
      throw new Error(errorMessage(error, "Could not unarchive conversation"));
    }
  },
  deleteConversationForMe: async (id) => {
    try {
      await axios.delete(`${API_URL}/conversations/${id}`);
    } catch (error) {
      throw new Error(errorMessage(error, "Could not delete conversation"));
    }
  },
  getConvoUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations/users`);
      return response.data.users;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load contacts"));
    }
  },
  startConversation: async (id, message) => {
    try {
      const response = await axios.post(
        `${API_URL}/conversations/start-conversation/${id}`,
        { message },
      );
      return response.data.id;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not start conversation"));
    }
  },
  sendMessage: async (id, message) => {
    try {
      const response = await axios.post(
        `${API_URL}/conversations/${id}/send-message`,
        message,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      set({ error: null });
      return response.data;
    } catch (error) {
      const messageText = errorMessage(error, "Could not send message");
      set({ error: messageText });
      throw new Error(messageText);
    }
  },
  sendFilesMessage: async (id, { messageText, files }) => {
    try {
      const formData = new FormData();
      formData.append("messageText", messageText);
      files.forEach((file) => formData.append("files", file));
      const response = await axios.post(
        `${API_URL}/conversations/${id}/send-files-message`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      set({ error: null });
      return response.data;
    } catch (error) {
      const messageText = errorMessage(error, "Could not send files");
      set({ error: messageText });
      throw new Error(messageText);
    }
  },
  sendVoiceMessage: async (id, { audio, durationSec }) => {
    try {
      const formData = new FormData();
      formData.append("audio", audio);
      formData.append("durationSec", String(durationSec));
      const response = await axios.post(
        `${API_URL}/conversations/${id}/send-voice-message`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      set({ error: null });
      return response.data;
    } catch (error) {
      const messageText = errorMessage(error, "Could not send voice message");
      set({ error: messageText });
      throw new Error(messageText);
    }
  },
  deleteMessage: async (id) => {
    try {
      const response = await axios.delete(
        `${API_URL}/conversations/delete-messages/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not delete message"));
    }
  },
  editMessage: async (id, text) => {
    try {
      const response = await axios.patch(
        `${API_URL}/conversations/edit-messages/${id}`,
        { newContent: text },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not edit message"));
    }
  },
  reactToMessage: async (id, emoji) => {
    try {
      const response = await axios.post(
        `${API_URL}/conversations/react-message/${id}`,
        { emoji },
      );
      return response.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not react to message"));
    }
  },
}));
