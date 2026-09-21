import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNotificationsApi } from "@universe/shared/api";
import { createNotificationMutations } from "@universe/shared/mutations";
import { httpClient } from "@/lib/api";

const notificationsApi = createNotificationsApi(httpClient);

export const useSeeNotifications = (userId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(createNotificationMutations(notificationsApi, queryClient).seeNotifications(userId));
};

export const useSeeNewMessages = (userId?: string, convoId?: string) => {
  const queryClient = useQueryClient();
  return useMutation(
    createNotificationMutations(notificationsApi, queryClient).seeNewMessages(userId, convoId),
  );
};
