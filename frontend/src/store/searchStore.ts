import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type { ChatUser, GroupConversation } from "../features/chat/types";
import type { Post, SearchPage } from "../queryAndMutation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
  fallback;

export type SearchOverview = {
  users: SearchPage<ChatUser>;
  posts: SearchPage<Post>;
  groups: SearchPage<GroupConversation>;
};

type SearchStore = {
  searchOverview: (query: string) => Promise<SearchOverview>;
  searchUsers: (query: string, offset?: number) => Promise<SearchPage<ChatUser>>;
  searchPosts: (query: string, offset?: number) => Promise<SearchPage<Post>>;
  searchGroups: (
    query: string,
    offset?: number,
  ) => Promise<SearchPage<GroupConversation>>;
};

export const useSearchStore = create<SearchStore>(() => ({
  searchOverview: async (query) => {
    try {
      const response = await axios.get(`${API_URL}/search`, {
        params: { q: query },
      });
      const { users, posts, groups } = response.data;
      return { users, posts, groups };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not search"));
    }
  },
  searchUsers: async (query, offset) => {
    try {
      const response = await axios.get(`${API_URL}/search/users`, {
        params: { q: query, offset },
      });
      return { items: response.data.items, hasMore: response.data.hasMore };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not search people"));
    }
  },
  searchPosts: async (query, offset) => {
    try {
      const response = await axios.get(`${API_URL}/search/posts`, {
        params: { q: query, offset },
      });
      return { items: response.data.items, hasMore: response.data.hasMore };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not search posts"));
    }
  },
  searchGroups: async (query, offset) => {
    try {
      const response = await axios.get(`${API_URL}/search/groups`, {
        params: { q: query, offset },
      });
      return { items: response.data.items, hasMore: response.data.hasMore };
    } catch (error) {
      throw new Error(errorMessage(error, "Could not search groups"));
    }
  },
}));
