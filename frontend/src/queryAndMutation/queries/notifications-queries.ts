import { createNotificationQueryHooks } from "@universe/shared/queries";
import { httpClient } from "@/lib/api";

export const {
  useGetUserNotifications,
  useGetNotificationsHistoryInfinite,
  useGetUnreadNotifications,
  useGetNewMessageNotifications,
} = createNotificationQueryHooks(httpClient);
