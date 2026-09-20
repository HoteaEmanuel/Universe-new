import axios from "axios";
import { create } from "zustand";
import Constants from "expo-constants";
const API_URL =
  Constants.expoConfig?.extra?.API_URL ||
  "https://nongerundively-vatic-manie.ngrok-free.dev/api";

  import api from "../app/utils/api";
axios.defaults.withCredentials = true;
export const useCommentsStore = create((set) => ({
  isLoading: false,
  getComments: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/post/${id}/comments`);
      return response.data.comments;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  likeComment: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.post(`${API_URL}/post/${id}/like-comment`);

      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  removeLikeComment: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.post(`${API_URL}/post/${id}/remove-like-comment`);
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getCommentsCount: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/post/${id}/comments-count`);
      return response.data.commentsCount;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  sendComment: async (id, comment) => {
    set({ isLoading: true });
    try {
      const response = await api.post(`${API_URL}/post/${id}/send-comment`, {
        comment: comment,
      });
      return response.data.comment;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  deleteComment: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.delete(`${API_URL}/post/${id}/delete-comment`);
      return response.data.comment;
    } catch (error) {
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
