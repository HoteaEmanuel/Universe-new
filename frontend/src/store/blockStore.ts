import axios, { AxiosError } from "axios";
import { create } from "zustand";
import type { BlockedUser } from "../features/chat/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const errorMessage = (error: unknown, fallback: string) =>
  (error as AxiosError<{ message?: string }>)?.response?.data?.message ||
  fallback;

type BlockStore = {
  getBlockedUsers: () => Promise<BlockedUser[]>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
};

export const useBlockStore = create<BlockStore>(() => ({
  getBlockedUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/blocks`);
      return response.data.blockedUsers;
    } catch (error) {
      throw new Error(errorMessage(error, "Could not load blocked users"));
    }
  },
  blockUser: async (userId) => {
    try {
      await axios.post(`${API_URL}/blocks/block`, { userId });
    } catch (error) {
      throw new Error(errorMessage(error, "Could not block user"));
    }
  },
  unblockUser: async (userId) => {
    try {
      await axios.post(`${API_URL}/blocks/unblock`, { userId });
    } catch (error) {
      throw new Error(errorMessage(error, "Could not unblock user"));
    }
  },
}));
