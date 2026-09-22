import { create } from "zustand";
import Constants from 'expo-constants';
import api from "../utils/api";
const API_URL =
  Constants.expoConfig?.extra?.API_URL || "https://nongerundively-vatic-manie.ngrok-free.dev/api";
api.defaults.withCredentials = true;
export const useUserStore = create((set) => ({
  isLoading: false,
  error: null,
  getAllUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/users`);
      return response.data;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUserByName: async (name) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/users-by-name/${name}`);
      return response.data.user;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUsersFromSameUniversity: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/users-from-same-university`);
      return response.data.users;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getUserById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/users/${id}`);
      return response.data.user;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  updateProfilePicture: async (image) => {
    set({ isLoading: true });
    try {
      const formdata = new FormData();
      formdata.append("image", image);
      const response = await api.put(
        `${API_URL}/update-profile-image`,
        formdata,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  savePost: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api  .post(`${API_URL}/posts/save/${id}`);
      return response;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  unsavePost: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.post(`${API_URL}/posts/unsave/${id}`);
      return response;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  followUser: async (id) => {
    if (!id) return {};
    set({ isLoading: true });
    try {
      const response = await api.post(`${API_URL}/follow`, { followId: id } );
      return response;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  unfollowUser: async (id) => {
    if (!id) return {};
    set({ isLoading: true });
    try {
      const response = await api.post(`${API_URL}/unfollow`, {
        unfollowId: id,
      });
      return response;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getFollowers: async (id) => {
    if (!id) return {};
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/followers/${id}`);
      return response.data.followers;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  getFollowing: async (id) => {
    if (!id) return {};
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/following/${id}`);
      return response.data.following;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  isFollowing: async (id) => {
    if (!id) return {};
    set({ isLoading: true });
    try {
      const response = await api.get(`${API_URL}/follows-user/${id}`);
      return response.data.isFollowing;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
  updateBio: async (bio) => {
    set({ isLoading: true });
    try {
      const response = await api.patch(`${API_URL}/update-bio`, { bio });
      return response;
    } catch (error) {
      set({ error: error });
      throw new Error(error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
