import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useGlobalStore } from "@/store/globalStore";
import type { Notification } from "@/queryAndMutation/types";
import { showNotificationToast } from "./NotificationToast";
import { urlPathName } from "@/utils/urlPathFromName";

const TOAST_TYPES = new Set(["message", "follow"]);

const NotificationSocketListener = () => {
  const { socket, user } = useAuthStore();
  const { notificationsOn } = useGlobalStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket || !user?.id || !notificationsOn) return;

    const handleNewNotification = (notification: Notification) => {
      queryClient.invalidateQueries({ queryKey: ["unread-notifications", user.id] });
      queryClient.invalidateQueries({ queryKey: ["new-messages", user.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-history", user.id] });

      if (!notification.type || !TOAST_TYPES.has(notification.type)) return;

      showNotificationToast(notification, () => {
        if (notification.type === "message" && notification.conversationId) {
          navigate(`/conversations/${notification.conversationId}`);
        } else if (notification.type === "message" && notification.groupId) {
          navigate(`/groups/${notification.groupId}`);
        } else if (notification.type === "follow" && notification.actionUser) {
          navigate(`/users/${urlPathName(notification.actionUser)}`);
        } else {
          navigate("/notifications");
        }
      });
    };

    socket.on("newNotification", handleNewNotification);
    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, [socket, user?.id, notificationsOn, queryClient, navigate]);

  return null;
};

export default NotificationSocketListener;
