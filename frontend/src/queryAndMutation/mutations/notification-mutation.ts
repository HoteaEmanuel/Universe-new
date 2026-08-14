import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotificationStore } from "../../store/notificationStore";

export const useSeeNotifications = (userId?: string) => {
  const { seeNotifications } = useNotificationStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await seeNotifications(userId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
      queryClient.invalidateQueries({
        queryKey: ["notifications-history", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["unread-notifications", userId],
      });
    },
  });
};

export const useSeeNewMessages = (userId?: string, convoId?: string) => {
  const { seeNewMessages } = useNotificationStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => await seeNewMessages(convoId as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["new-messages", userId] });
    },
  });
};
