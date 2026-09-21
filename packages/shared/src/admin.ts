import type { AccountType, UserRole } from "./domain.js";
import type { CursorPage } from "./pagination.js";

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

export type AdminUsersPage = CursorPage<AdminUser>;

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
  pendingReports: number;
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
