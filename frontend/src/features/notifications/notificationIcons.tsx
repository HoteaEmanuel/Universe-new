import { Heart, MessageCircle, Reply, UserPlus, Mail } from "lucide-react";
import type { Notification } from "@/queryAndMutation/types";

const TYPE_ICON: Record<string, typeof Heart> = {
  "post-like": Heart,
  "comment-like": Heart,
  "post-comment": MessageCircle,
  "post-reply": Reply,
  follow: UserPlus,
  message: Mail,
};

export const getNotificationIcon = (type?: string | null) =>
  (type && TYPE_ICON[type]) || Heart;

const AVATAR_SIZE_CLASSES = {
  sm: { avatar: "size-9", badge: "size-4", badgeIcon: "size-2.5" },
  md: { avatar: "size-10", badge: "size-5", badgeIcon: "size-3" },
} as const;

export const NotificationAvatar = ({
  notification,
  size = "md",
}: {
  notification: Notification;
  size?: keyof typeof AVATAR_SIZE_CLASSES;
}) => {
  const Icon = getNotificationIcon(notification.type);
  const classes = AVATAR_SIZE_CLASSES[size];

  return (
    <div className="relative shrink-0">
      {notification.actionUser?.profilePicture ? (
        <img
          src={notification.actionUser.profilePicture}
          alt=""
          className={`${classes.avatar} rounded-full object-cover ring-1 ring-border`}
        />
      ) : (
        <div
          className={`flex ${classes.avatar} items-center justify-center rounded-full bg-muted text-muted-foreground`}
        >
          <Icon className="size-1/2" />
        </div>
      )}
      <div
        className={`absolute -bottom-1 -right-1 flex ${classes.badge} items-center justify-center rounded-full bg-background ring-1 ring-border`}
      >
        <Icon className={`${classes.badgeIcon} text-primary`} />
      </div>
    </div>
  );
};
