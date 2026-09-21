import type { AdminStats, AdminUsersPage, DailyActivity, UniversityCount } from "../admin.js";
import type { HttpClient } from "./client.js";

export const createAdminApi = (client: HttpClient) => ({
  getStats: () => client.get<AdminStats>("/admin/stats"),

  getDailyActivity: async () =>
    (await client.get<{ activity: DailyActivity[] }>("/admin/stats/daily-activity")).activity,

  getTopUniversities: async () =>
    (await client.get<{ universities: UniversityCount[] }>("/admin/stats/top-universities"))
      .universities,

  listUsers: (cursor?: string, search?: string) =>
    client.get<AdminUsersPage>("/admin/users", { cursor, search: search || undefined }),

  blockUser: (id: string, reason?: string) =>
    client.post<unknown>(`/admin/users/${id}/block`, { reason }),

  unblockUser: (id: string) => client.post<unknown>(`/admin/users/${id}/unblock`),
});
