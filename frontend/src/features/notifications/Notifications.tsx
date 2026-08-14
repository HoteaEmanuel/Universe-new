import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useSeeNotifications } from "@/queryAndMutation/mutations/notification-mutation";
import {
  useGetNotificationsHistoryInfinite,
  useGetUnreadNotifications,
} from "@/queryAndMutation/queries/notifications-queries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationItem from "@/features/notifications/NotificationItem";
import {
  AllCaughtUpState,
  NoNotificationsState,
} from "@/features/notifications/NotificationEmptyState";

const SCROLL_FETCH_THRESHOLD = 150;

const NotificationSkeletonRow = () => (
  <div className="flex items-start gap-2.5 p-2">
    <Skeleton className="size-10 shrink-0 rounded-full" />
    <div className="flex-1 space-y-1.5 pt-1">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

const NotificationSkeletonList = () => (
  <div className="flex flex-col gap-1">
    {Array.from({ length: 5 }).map((_, i) => (
      <NotificationSkeletonRow key={i} />
    ))}
  </div>
);

const UnseenNotifications = () => {
  const { user } = useAuthStore();
  const { data: notifications, isPending } = useGetUnreadNotifications(user.id);

  if (isPending) return <NotificationSkeletonList />;

  if (!notifications?.length) {
    return <AllCaughtUpState />;
  }

  return (
    <div className="flex flex-col gap-1">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

const NotificationHistory = () => {
  const { user } = useAuthStore();
  const {
    data,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetNotificationsHistoryInfinite(user.id);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollEl = listRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (hasNextPage && !isFetchingNextPage && distanceFromBottom < SCROLL_FETCH_THRESHOLD) {
        fetchNextPage();
      }
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <NotificationSkeletonList />;

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  if (!notifications.length) {
    return <NoNotificationsState />;
  }

  return (
    <div ref={listRef} className="flex h-full min-h-0 flex-col gap-1 overflow-y-auto">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
      {isFetchingNextPage && <NotificationSkeletonRow />}
    </div>
  );
};

const Notifications = () => {
  const { user } = useAuthStore();
  const { mutate: seeNotifications } = useSeeNotifications(user.id);

  useEffect(() => {
    const timeoutId = setTimeout(() => seeNotifications(), 2000);
    return () => clearTimeout(timeoutId);
  }, [seeNotifications]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col p-4">
      <h1 className="mb-4 shrink-0 text-2xl font-semibold">Notifications</h1>
      <Tabs defaultValue="unseen" className="min-h-0 flex-1">
        <TabsList className="shrink-0">
          <TabsTrigger value="unseen">Unseen</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="unseen" className="min-h-0 flex-1 overflow-y-auto">
          <UnseenNotifications />
        </TabsContent>
        <TabsContent value="history" className="min-h-0 flex-1">
          <NotificationHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
