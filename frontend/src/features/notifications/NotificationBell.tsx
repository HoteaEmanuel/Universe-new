import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetUnreadNotifications } from "@/queryAndMutation/queries/notifications-queries";
import { useSeeNotifications } from "@/queryAndMutation/mutations/notification-mutation";
import NotificationItem from "./NotificationItem";
import { AllCaughtUpState } from "./NotificationEmptyState";
import CountBadge from "@/components/CountBadge";

const POPOVER_PREVIEW_LIMIT = 8;

const NotificationBell = ({
  icon: Icon = Bell,
  iconClassName,
  badgeCount,
}: {
  icon?: typeof Bell;
  iconClassName?: string;
  badgeCount: number;
}) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const user = authUser!;
  const [open, setOpen] = useState(false);
  const { data: notifications, isLoading } = useGetUnreadNotifications(user.id);
  const { mutate: seeNotifications, isPending: isMarkingSeen } =
    useSeeNotifications(user.id);

  const preview = notifications?.slice(0, POPOVER_PREVIEW_LIMIT) ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative flex shrink-0"
        onClick={(e: React.MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Icon className={iconClassName} />
        {badgeCount > 0 && <CountBadge count={badgeCount} />}
      </PopoverTrigger>
      <PopoverContent align="start" side="right" sideOffset={12}>
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="text-sm font-semibold">Notifications</h2>
          {preview.length > 0 && (
            <button
              type="button"
              onClick={() => seeNotifications()}
              disabled={isMarkingSeen}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              <CheckCheck className="size-3.5" />
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {isLoading && (
            <p className="p-3 list-loading-text">
              Loading…
            </p>
          )}
          {!isLoading && preview.length === 0 && <AllCaughtUpState compact />}
          {preview.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate("/notifications");
          }}
          className="w-full border-t border-border p-2.5 text-center text-sm font-medium text-primary hover:bg-accent"
        >
          View all
        </button>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
