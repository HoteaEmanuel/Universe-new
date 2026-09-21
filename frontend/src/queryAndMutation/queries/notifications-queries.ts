import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createNotificationsApi } from "@universe/shared/api";
import { createNotificationQueries } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

const notificationsApi = createNotificationsApi(httpClient);
const notificationQueries = createNotificationQueries(notificationsApi);

export const useGetUserNotifications = (userId?: string) => useQuery(notificationQueries.list(userId));

export const useGetNotificationsHistoryInfinite = (userId?: string) =>
  useInfiniteQuery(notificationQueries.history(userId));

export const useGetUnreadNotifications = (userId?: string) => useQuery(notificationQueries.unread(userId));

export const useGetNewMessageNotifications = (userId?: string) =>
  useQuery(notificationQueries.newMessages(userId));
