import { create } from "zustand";
import axios from "axios";
import type { AccountType, UserRole } from "@/queryAndMutation/types";

const API_URL = "http://localhost:5000/api";

export type AdminUserStatus = "active" | "blocked";

export type AdminUser = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  profilePicture?: string | null;
  role: UserRole;
  accountType: AccountType;
  createdAt?: string;
  accountStatus: {
    status: AdminUserStatus;
    reason: string | null;
    blockedAt: string | null;
  } | null;
};

export type AdminUsersPage = {
  items: AdminUser[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type AdminStats = {
  totalUsers: number;
  newUsersThisWeek: number;
  blockedUsers: number;
  activeUsers: number;
  pendingBusinessRegistrations: number;
  businessAccounts: number;
  totalPosts: number;
  totalGroups: number;
  totalEvents: number;
};

export type DailyActivity = {
  date: string;
  newUsers: number;
  newPosts: number;
};

export type UniversityCount = {
  university: string;
  count: number;
};

type AdminStore = {
  getStats: () => Promise<AdminStats>;
  getDailyActivity: () => Promise<DailyActivity[]>;
  getTopUniversities: () => Promise<UniversityCount[]>;
  getUsersPage: (cursor?: string, search?: string) => Promise<AdminUsersPage>;
  blockUser: (id: string, reason?: string) => Promise<void>;
  unblockUser: (id: string) => Promise<void>;
};

export const useAdminStore = create<AdminStore>(() => ({
  getStats: async () => {
    const response = await axios.get(`${API_URL}/admin/stats`);
    return response.data;
  },
  getDailyActivity: async () => {
    const response = await axios.get(`${API_URL}/admin/stats/daily-activity`);
    return response.data.activity;
  },
  getTopUniversities: async () => {
    const response = await axios.get(`${API_URL}/admin/stats/top-universities`);
    return response.data.universities;
  },
  getUsersPage: async (cursor, search) => {
    const response = await axios.get(`${API_URL}/admin/users`, {
      params: { cursor, search: search || undefined },
    });
    return response.data;
  },
  blockUser: async (id, reason) => {
    await axios.post(`${API_URL}/admin/users/${id}/block`, { reason });
  },
  unblockUser: async (id) => {
    await axios.post(`${API_URL}/admin/users/${id}/unblock`);
  },
}));
