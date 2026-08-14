import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNotificationStore } from "../../store/notificationStore";
import type { Notification, NotificationsPage } from "../types";

export const useGetUserNotifications = (userId?: string) => {
  const { getNotifications } = useNotificationStore();
  return useQuery<Notification[]>({
    queryFn: async () => await getNotifications(userId as string),
    queryKey: ["notifications", userId],
    enabled: !!userId,
  });
};

export const useGetNotificationsHistoryInfinite = (userId?: string) => {
  const { getNotificationsHistory } = useNotificationStore();
  return useInfiniteQuery<NotificationsPage>({
    queryKey: ["notifications-history", userId],
    queryFn: ({ pageParam }) =>
      getNotificationsHistory(userId as string, pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled: !!userId,
  });
};

export const useGetUnreadNotifications = (userId?: string) => {
  const { getUnreadNotifications } = useNotificationStore();
  return useQuery<Notification[]>({
    queryFn: async () => await getUnreadNotifications(userId as string),
    queryKey: ["unread-notifications", userId],
    enabled: !!userId,
  });
};

export const useGetNewMessageNotifications = (userId?: string) => {
  const { getNewMessagesNotifications } = useNotificationStore();
  return useQuery<Notification[]>({
    queryFn: async () => await getNewMessagesNotifications(userId as string),
    queryKey: ["new-messages", userId],
    enabled: !!userId,
  });
};
