import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createNotificationsApi } from "../api/notifications.js";
import { notificationKeys } from "../queries/keys.js";

type NotificationsApi = ReturnType<typeof createNotificationsApi>;

export const createNotificationMutations = (api: NotificationsApi, queryClient: QueryClient) => ({
  seeNotifications: (userId?: string) =>
    mutationOptions({
      mutationFn: () => api.markSeen(userId as string),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.list(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: notificationKeys.history(userId ?? "") });
        queryClient.invalidateQueries({ queryKey: notificationKeys.unread(userId ?? "") });
      },
    }),

  // `userId` is only used to build the invalidation key - the actual
  // mutation is scoped by `convoId` (matches the original store, whose
  // `seeNewMessages` never took a userId either).
  seeNewMessages: (userId?: string, convoId?: string) =>
    mutationOptions({
      mutationFn: () => api.markNewMessagesSeen(convoId as string),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.newMessages(userId ?? "") });
      },
    }),
});
