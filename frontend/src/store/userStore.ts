import { create } from "zustand";
import axios from "axios";
import type { User, FollowUser, FollowListPage } from "../queryAndMutation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

type UserStore = {
  isLoading: boolean;
  error: unknown;
  getAllUsers: () => Promise<User[]>;
  getUserByName: (name: string) => Promise<User | undefined>;
  getUsersFromSameUniversity: () => Promise<User[] | undefined>;
  getUserById: (id: string) => Promise<User | undefined>;
  updateProfilePicture: (image: File) => Promise<unknown>;
  savePost: (id: string) => Promise<unknown>;
  unsavePost: (id: string) => Promise<unknown>;
  followUser: (id?: string) => Promise<unknown>;
  unfollowUser: (id?: string) => Promise<unknown>;
  getFollowers: (id?: string) => Promise<FollowUser[] | undefined>;
  getFollowing: (id?: string) => Promise<FollowUser[] | undefined>;
  getRelevantFollowers: (
    id?: string,
    cursor?: string,
  ) => Promise<FollowListPage | undefined>;
  getRelevantFollowing: (
    id?: string,
    cursor?: string,
  ) => Promise<FollowListPage | undefined>;
  isFollowing: (id?: string) => Promise<boolean | undefined>;
  updateBio: (bio: string) => Promise<unknown>;
};

export const useUserStore = create<UserStore>((set) => ({
  isLoading: false,
  error: null,
  getAllUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/users`);
      return response.data;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  getUserByName: async (name) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/users-by-name/${name}`);
      return response.data.user;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  getUsersFromSameUniversity: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/users-from-same-university`);
      return response.data.users;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  getUserById: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/users/${id}`);
      return response.data.user;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  updateProfilePicture: async (image) => {
    set({ isLoading: true });
    try {
      const formdata = new FormData();
      formdata.append("image", image);
      const response = await axios.put(
        `${API_URL}/update-profile-image`,
        formdata,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  savePost: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/posts/save/${id}`);
      return response;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  unsavePost: async (id) => {
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/posts/unsave/${id}`);
      return response;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  followUser: async (id) => {
    if (!id) return {};
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/follow`, { followerId: id });
      return response;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  unfollowUser: async (id) => {
    if (!id) return {};
    set({ isLoading: true });
    try {
      const response = await axios.post(`${API_URL}/unfollow`, {
        unfollowId: id,
      });
      return response;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  getFollowers: async (id) => {
    if (!id) return undefined;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/followers/${id}`);
      return response.data.followers;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  getFollowing: async (id) => {
    if (!id) return undefined;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/following/${id}`);
      return response.data.following;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  getRelevantFollowers: async (id, cursor) => {
    if (!id) return undefined;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/followers-relevant/${id}`, {
        params: cursor ? { cursor } : undefined,
      });
      return {
        users: response.data.followers,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  getRelevantFollowing: async (id, cursor) => {
    if (!id) return undefined;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/following-relevant/${id}`, {
        params: cursor ? { cursor } : undefined,
      });
      return {
        users: response.data.following,
        nextCursor: response.data.nextCursor,
        hasMore: response.data.hasMore,
      };
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  isFollowing: async (id) => {
    if (!id) return undefined;
    set({ isLoading: true });
    try {
      const response = await axios.get(`${API_URL}/follows-user/${id}`);
      return response.data.isFollowing;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  updateBio: async (bio) => {
    set({ isLoading: true });
    try {
      const response = await axios.patch(`${API_URL}/update-bio`, { bio });
      return response;
    } catch (error) {
      set({ error: error });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));
