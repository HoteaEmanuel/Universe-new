import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Inbox } from "lucide-react";

const NotificationEmptyState = ({
  icon: Icon,
  message,
  compact = false,
}: {
  icon: LucideIcon;
  message: string;
  compact?: boolean;
}) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? "py-8" : "py-14"}`}
  >
    <span
      className={`flex items-center justify-center rounded-full bg-primary/10 text-primary ${compact ? "size-12" : "size-16"}`}
    >
      <Icon className={compact ? "size-6" : "size-8"} />
    </span>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export const AllCaughtUpState = ({ compact = false }: { compact?: boolean }) => (
  <NotificationEmptyState icon={CheckCircle2} message="You're all caught up." compact={compact} />
);

export const NoNotificationsState = ({ compact = false }: { compact?: boolean }) => (
  <NotificationEmptyState icon={Inbox} message="No notifications yet." compact={compact} />
);

export default NotificationEmptyState;
