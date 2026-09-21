import type { Notification, NotificationsPage } from "../notification.js";
import type { HttpClient } from "./client.js";

export const createNotificationsApi = (client: HttpClient) => ({
  list: async (id: string) =>
    (await client.get<{ notifications: Notification[] }>(`/notifications/${id}`)).notifications,

  listHistory: (id: string, cursor?: string, limit = 20) =>
    client.get<NotificationsPage>(`/notifications/${id}`, { cursor, limit }),

  listUnread: async (id: string) =>
    (await client.get<{ notifications: Notification[] }>(`/unread-notifications/${id}`)).notifications,

  listNewMessages: async (id: string) =>
    (await client.get<{ notifications: Notification[] }>(`/unread-message-notifications/${id}`))
      .notifications,

  markSeen: (id: string) => client.post<{ message: string }>(`/seen-notifications/${id}`),

  markNewMessagesSeen: (convoId: string) =>
    client.post<{ message: string }>(`/see-new-messages/${convoId}`),
});
