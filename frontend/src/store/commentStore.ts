import axios from "axios";
import { create } from "zustand";
import type { PostComment, PostCommentsPage } from "../queryAndMutation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

type CommentStore = {
  isLoading: boolean;
  getComments: (id?: string, cursor?: string, limit?: number) => Promise<PostCommentsPage>;
  getCommentReplies: (
    postId?: string,
    parentId?: string,
    cursor?: string,
    limit?: number,
  ) => Promise<PostCommentsPage>;
  likeComment: (id: string) => Promise<{ message: string }>;
  removeLikeComment: (id: string) => Promise<{ message: string }>;
  getCommentsCount: (id?: string) => Promise<number>;
  sendComment: (
    id?: string,
    comment?: string,
    parentId?: string,
  ) => Promise<{ data: { message: string } }>;
  deleteComment: (id: string) => Promise<{ data: { message: string } }>;
};

export const useCommentsStore = create<CommentStore>((set) => ({
  isLoading: false,
  getComments: async (id, cursor, limit = 20) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/posts/${id}/comments`, {
        params: { cursor, limit },
      });
      return {
        comments: response.data.comments as PostComment[],
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      throw new Error(error as string);
    } finally {
      set({ isLoading: false });
    }
  },
  getCommentReplies: async (postId, parentId, cursor, limit = 20) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(
        `${API_URL}/posts/${postId}/comments/${parentId}/replies`,
        { params: { cursor, limit } },
      );
      return {
        comments: response.data.comments as PostComment[],
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      throw new Error(error as string);
    } finally {
      set({ isLoading: false });
    }
  },
  likeComment: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/posts/${id}/like-comment`);
      return response.data;
    } catch (error) {
      throw new Error(error as string);
    } finally {
      set({ isLoading: false });
    }
  },
  removeLikeComment: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/posts/${id}/remove-like-comment`);
      return response.data;
    } catch (error) {
      throw new Error(error as string);
    } finally {
      set({ isLoading: false });
    }
  },
  getCommentsCount: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/posts/${id}/comments-count`);
      return response.data.commentsCount;
    } catch (error) {
      throw new Error(error as string);
    } finally {
      set({ isLoading: false });
    }
  },
  sendComment: async (id, comment, parentId) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/posts/${id}/send-comment`, {
        comment: comment,
        parentId,
      });
      return response;
    } catch (error) {
      throw new Error(error as string);
    } finally {
      set({ isLoading: false });
    }
  },
  deleteComment: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.delete(`${API_URL}/posts/${id}/delete-comment`);
      return response;
    } catch (error) {
      throw new Error(error as string);
    } finally {
      set({ isLoading: false });
    }
  },
}));
