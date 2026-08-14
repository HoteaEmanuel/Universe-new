import { toast } from "sonner";
import { X } from "lucide-react";
import type { Notification } from "@/queryAndMutation/types";
import { NotificationAvatar } from "./notificationIcons";

const NotificationToastContent = ({
  toastId,
  notification,
  onView,
}: {
  toastId: string | number;
  notification: Notification;
  onView: () => void;
}) => {
  return (
    <div className="flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-popover p-3 pr-2 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
      <NotificationAvatar notification={notification} size="sm" />
      <button
        type="button"
        onClick={onView}
        className="min-w-0 flex-1 text-left"
      >
        <p className="text-sm font-semibold leading-snug">
          {notification.title || "New notification"}
        </p>
        {notification.message && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
            {notification.message}
          </p>
        )}
      </button>
      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

export const showNotificationToast = (
  notification: Notification,
  onView: () => void,
) => {
  toast.custom(
    (toastId) => (
      <NotificationToastContent
        toastId={toastId}
        notification={notification}
        onView={() => {
          toast.dismiss(toastId);
          onView();
        }}
      />
    ),
    {
      duration: 6000,
      unstyled: true,
      style: {
        background: "transparent",
        border: "none",
        boxShadow: "none",
        padding: 0,
        width: "100%",
      },
    },
  );
};
