import axios from "axios";
import { create } from "zustand";
import Constants from "expo-constants";
import api from "../app/utils/api";
const API_URL =
  Constants.expoConfig?.extra?.API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

export const usePostStore = create((set) => ({
  isLoading: false,
  error: null,
  getPostUser: async (id) => {
    set({ isLoading: true });
    if (!id) return;
    try {
      const response = await api.get(`${API_URL}/post-user/${id}`);
      const user = response.data.user;
      return user;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUserPosts: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/user-posts/${id}`);
      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getSavedPosts: async (id) => {
    set({ isLoading: true });

    try {
      const response = await api.get(`${API_URL}/saved-posts/${id}`);
      console.log(response);
      return response.data.savedPosts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getPost: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/post/${id}`);
      const post = response.data.post;
      console.log("POST IN GET POST: ", post);
      return post;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  createPost: async (post) => {
    set({ isLoading: true });
    console.log("CALLING THE API");
    try {
      const formData = new FormData();
      console.log(post);
      formData.append("title", post.title);
      if (post?.caption) formData.append("caption", post.caption);
      if (post?.location) formData.append("location", post.location);
      formData.append("tags", post.tags);
      post.images.forEach((item) => {
        formData.append("images", {
          uri: item.uri,
          name: item.fileName,
          type: item.mimeType,
        });
      });
      console.log("HEEERE");
      console.log(formData);
      await api.post(`${API_URL}/posts`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("FINIISH");
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  updatePost: async (data) => {
    set({ isLoading: true });
    try {
      await api.patch(`${API_URL}/posts/${data.id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  deletePost: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`${API_URL}/posts/${id}`);
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getRelatedPosts: async (tag) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/related-posts/${tag}`);

      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getPosts: async (feed) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/posts/${feed}`);
      return response.data.posts;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  getLikes: async (postId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/likes/${postId}`);
      return response.data.likes;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  userHasLiked: async (postId) => {
    console.log("POST ID HIR: " + postId);
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/user-liked/${postId}`);
      return response.data.hasLiked;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  getUsersWhoLikedPost: async (postId) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/users-who-liked/${postId}`);
      return response.data.users;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  likePost: async ({ postId }) => {
    set({ isLoading: true });
    console.log("POST ID HERE: ") + console.log(postId);
    try {
      const response = await api.post(`${API_URL}/like-post`, {
        postId,
      });
      return response.data;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  unlikePost: async ({ postId }) => {
    set({ isLoading: true });
    console.log("UNLiKING POST" + postId);
    try {
      const response = await api.post(`${API_URL}/unlike-post`, {
        postId,
      });
      return response.data;
    } catch (error) {
      set({ error: error });
    } finally {
      set({ isLoading: false });
    }
  },
  checkSaved: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/check-saved/${id}`);
      return response.data;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },

  getPostsByName: async (name) => {
    try {
      const response = await api.get(`${API_URL}/posts-by-name/${name}`);
      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getPostsByTag: async (tag) => {
    try {
      const response = await api.get(`${API_URL}/posts-by-tag/${tag}`);
      return response.data.posts;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
