import axios from "axios";
import { create } from "zustand";
import type { Notification, NotificationsPage } from "../queryAndMutation/types";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

type NotificationStore = {
  getNotifications: (id: string) => Promise<Notification[]>;
  getNotificationsHistory: (
    id: string,
    cursor?: string,
    limit?: number,
  ) => Promise<NotificationsPage>;
  getUnreadNotifications: (id: string) => Promise<Notification[]>;
  getNewMessagesNotifications: (id: string) => Promise<Notification[]>;
  seeNotifications: (id: string) => Promise<string>;
  seeNewMessages: (convoId: string) => Promise<string>;
};

export const useNotificationStore = create<NotificationStore>(() => ({
  getNotifications: async (id) => {
    const response = await axios.get(`${API_URL}/notifications/${id}`);
    return response.data.notifications;
  },
  getNotificationsHistory: async (id, cursor, limit = 20) => {
    const response = await axios.get(`${API_URL}/notifications/${id}`, {
      params: { cursor, limit },
    });
    return {
      notifications: response.data.notifications,
      nextCursor: response.data.nextCursor,
      hasMore: response.data.hasMore,
    };
  },
  getUnreadNotifications: async (id) => {
    const response = await axios.get(`${API_URL}/unread-notifications/${id}`);
    return response.data.notifications;
  },
  getNewMessagesNotifications: async (id) => {
    const response = await axios.get(
      `${API_URL}/unread-message-notifications/${id}`,
    );
    return response.data.notifications;
  },
  seeNotifications: async (id) => {
    const response = await axios.post(`${API_URL}/seen-notifications/${id}`);
    return response.data.message;
  },
  seeNewMessages: async (convoId) => {
    const response = await axios.post(`${API_URL}/see-new-messages/${convoId}`);
    return response.data.message;
  },
}));
