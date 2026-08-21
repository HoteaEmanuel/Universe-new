import { useNavigate } from "react-router-dom";
import { urlPathName } from "@/utils/urlPathFromName";
import { formatDateDetailed } from "@/utils/formatDate";
import type { Notification } from "@/queryAndMutation/types";
import { NotificationAvatar } from "./notificationIcons";

const NotificationItem = ({ notification }: { notification: Notification }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (notification.type === "message") {
      if (notification.conversationId) {
        navigate(`/conversations/${notification.conversationId}`);
        return;
      }
      if (notification.groupId) {
        navigate(`/groups/${notification.groupId}`);
        return;
      }
    }
    if (notification.actionUser) {
      navigate(`/u/${urlPathName(notification.actionUser)}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-start gap-2.5 rounded-md p-2 text-left transition-colors hover:bg-accent"
    >
      <NotificationAvatar notification={notification} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${!notification.read ? "font-semibold" : ""}`}>
          {notification.message}
        </p>
        <time className="text-xs text-muted-foreground">
          {formatDateDetailed(notification.createdAt)}
        </time>
      </div>
      {!notification.read && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
};

export default NotificationItem;
