import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type {
  ChatMediaPage,
  ChatMessage,
  ChatMessagePage,
  ChatUser,
  DirectConversation,
} from "../features/chat/types";

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
  getConvoMedia: (id: string, before?: string) => Promise<ChatMediaPage>;
  getConversationByUsersIds: (id: string) => Promise<DirectConversation | null>;
  getUserConversations: () => Promise<DirectConversation[]>;
  getConvoUsers: () => Promise<ChatUser[]>;
  startConversation: (id: string, message: string) => Promise<string>;
  sendMessage: (
    id: string,
    message: Record<string, unknown>,
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
      };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load messages"));
    }
  },
  getConvoMedia: async (id, before) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${id}/media`, {
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
  getUserConversations: async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations`);
      return response.data.conversations;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load conversations"));
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
