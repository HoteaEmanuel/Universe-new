import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { createNotificationsApi } from "../api/notifications.js";
import { notificationKeys } from "./keys.js";
import { cursorPagination } from "./pageHelpers.js";

type NotificationsApi = ReturnType<typeof createNotificationsApi>;

export const createNotificationQueries = (api: NotificationsApi) => ({
  list: (userId?: string) =>
    queryOptions({
      queryKey: notificationKeys.list(userId ?? ""),
      queryFn: () => api.list(userId as string),
      enabled: !!userId,
    }),

  history: (userId?: string) =>
    infiniteQueryOptions({
      queryKey: notificationKeys.history(userId ?? ""),
      queryFn: ({ pageParam }) => api.listHistory(userId as string, pageParam),
      ...cursorPagination(),
      enabled: !!userId,
    }),

  unread: (userId?: string) =>
    queryOptions({
      queryKey: notificationKeys.unread(userId ?? ""),
      queryFn: () => api.listUnread(userId as string),
      enabled: !!userId,
    }),

  newMessages: (userId?: string) =>
    queryOptions({
      queryKey: notificationKeys.newMessages(userId ?? ""),
      queryFn: () => api.listNewMessages(userId as string),
      enabled: !!userId,
    }),
});
