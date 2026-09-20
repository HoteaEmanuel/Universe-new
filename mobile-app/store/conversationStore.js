import axios from "axios";
import { create } from "zustand";
import { useAuthStore } from "./authStore";
import { QueryClient } from "@tanstack/react-query";
const API_URL =
  import.meta.env.API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

export const useConversationStore = create((set) => ({
  isLoading: false,
  messages: [],
  getConvoById: async (id) => {
    set({ isLoading: false });
    try {
      const response = await axios.get(`${API_URL}/conversations/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUserByConvoId: async (id) => {
    set({ isLoading: false });
    try {
      const response = await axios.get(`${API_URL}/conversations/${id}/user`);
      return response.data.user;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getMessages: async (id) => {
    set({ isLoading: false });
    try {
      const response = await axios.get(
        `${API_URL}/conversations/${id}/messages`,
      );
      return response.data.messages;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getConversationByUsersIds: async (id) => {
    set({ isLoading: false });
    try {
      const response = await axios.get(`${API_URL}/conversations/user/${id}`);
      return response.data.conversation;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUserConversations: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/conversations`);
      return response.data.conversations;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getConvoUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/conversations/users`);
      return response.data.users;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  startConversation: async (id, message) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_URL}/conversations/start-conversation/${id}`,
        {
          message,
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  sendMessage: async (id, message) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(
        `${API_URL}/conversations/${id}/send-message`,
        message,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  deleteMessage: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.delete(
        `${API_URL}/conversations/delete-message/${id}`,
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  editMessage: async (id, text) => {
    set({ isLoading: true });
    try {
      const response = await axios.patch(
        `${API_URL}/conversations/edit-message/${id}`,
        { text },
      );
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getLiveMessages: async () => {
    const socket = useAuthStore.getState().socket;
    socket.on("newMessage", (newMessage) => {
      return newMessage;
    });
  },
}));
