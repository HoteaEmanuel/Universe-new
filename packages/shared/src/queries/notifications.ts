import { infiniteQueryOptions, queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { createNotificationsApi } from "../api/notifications.js";
import type { HttpClient } from "../api/client.js";
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

// Ready-to-use hooks for every read-only, side-effect-free notification
// query — see the identical note on createUserQueryHooks in ./users.ts for
// why this exists instead of each app redeclaring the same useQuery
// wrapper.
export const createNotificationQueryHooks = (httpClient: HttpClient) => {
  const api = createNotificationsApi(httpClient);
  const queries = createNotificationQueries(api);
  return {
    useGetUserNotifications: (userId?: string) => useQuery(queries.list(userId)),
    useGetNotificationsHistoryInfinite: (userId?: string) => useInfiniteQuery(queries.history(userId)),
    useGetUnreadNotifications: (userId?: string) => useQuery(queries.unread(userId)),
    useGetNewMessageNotifications: (userId?: string) => useQuery(queries.newMessages(userId)),
  };
};
