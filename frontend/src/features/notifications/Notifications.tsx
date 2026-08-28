import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAuthStore } from "@/store/authStore";
import { useSeeNotifications } from "@/queryAndMutation/mutations/notification-mutation";
import { useGetNotificationsHistoryInfinite } from "@/queryAndMutation/queries/notifications-queries";
import { Skeleton } from "@/components/ui/skeleton";
import NotificationItem from "@/features/notifications/NotificationItem";
import { NoNotificationsState } from "@/features/notifications/NotificationEmptyState";
import { findScrollableAncestor } from "@/utils/scroll";
import type { Notification } from "@/queryAndMutation/types";

const SCROLL_FETCH_THRESHOLD = 150;
// Notification rows vary with message length wrapping to multiple lines —
// this is just the initial guess react-virtual uses before
// `measureElement` corrects it to the row's real rendered height.
const ESTIMATED_NOTIFICATION_HEIGHT = 64;
// Newest notifications, always shown in full regardless of read state.
const RECENT_COUNT = 10;
// How many older notifications show before "View all" is needed.
const OLDER_PREVIEW_COUNT = 5;

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

const NotificationList = ({
  notifications,
}: {
  notifications: Notification[];
}) => (
  <div className="flex flex-col gap-1">
    {notifications.map((notification) => (
      <NotificationItem key={notification.id} notification={notification} />
    ))}
  </div>
);

// Renders the full, paginated notification history once "View all" is
// clicked. Reuses the project's ancestor-scroll pagination pattern (see
// CommentsContainer) rather than owning its own scroll container, since
// this section lives inline on a page that scrolls as a whole.
const NotificationHistoryList = ({
  notifications,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: {
  notifications: Notification[];
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}) => {
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  // The list isn't alone in the scroll container — the "Recent" section and
  // this section's own heading sit above it — so the virtualizer needs to
  // know that offset (scrollMargin) or its item positions are computed
  // relative to the whole page instead of relative to this div, which both
  // misjudges which rows are on-screen and pushes rows outside the div's
  // own height. See https://tanstack.com/virtual/latest/docs/api/virtualizer#scrollmargin
  const [scrollMargin, setScrollMargin] = useState(0);
  const listRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const scrollEl = findScrollableAncestor(node);
    scrollContainerRef.current = scrollEl;
    if (scrollEl) {
      const containerRect = scrollEl.getBoundingClientRect();
      const listRect = node.getBoundingClientRect();
      setScrollMargin(listRect.top - containerRect.top + scrollEl.scrollTop);
    }
  }, []);

  const virtualizer = useVirtualizer({
    count: notifications.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ESTIMATED_NOTIFICATION_HEIGHT,
    overscan: 8,
    scrollMargin,
    getItemKey: (index) => notifications[index].id,
  });

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (
        hasNextPage &&
        !isFetchingNextPage &&
        distanceFromBottom < SCROLL_FETCH_THRESHOLD
      ) {
        fetchNextPage();
      }
    };
    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, notifications.length]);

  return (
    <>
      <div
        ref={listRef}
        className="relative"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const notification = notifications[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full pb-1"
              style={{
                transform: `translateY(${virtualItem.start - scrollMargin}px)`,
              }}
            >
              <NotificationItem notification={notification} />
            </div>
          );
        })}
      </div>
      {isFetchingNextPage && <NotificationSkeletonRow />}
    </>
  );
};

const Notifications = () => {
  const { user } = useAuthStore();
  const { mutate: seeNotifications } = useSeeNotifications(user!.id);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetNotificationsHistoryInfinite(user!.id);

  // Clears the unread badge shortly after the page is viewed. Unlike the
  // old Unseen tab, the lists below aren't filtered by read state, so this
  // no longer makes notifications vanish out from under the user.

  useEffect(() => {
    document.title = "Notifications";
  }, []);
  useEffect(() => {
    const timeoutId = setTimeout(() => seeNotifications(), 2000);
    return () => clearTimeout(timeoutId);
  }, [seeNotifications]);

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const recent = notifications.slice(0, RECENT_COUNT);
  const older = notifications.slice(RECENT_COUNT);
  const olderPreview = older.slice(0, OLDER_PREVIEW_COUNT);
  const hasMoreOlder = older.length > OLDER_PREVIEW_COUNT || !!hasNextPage;

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>

      {isPending && <NotificationSkeletonList />}

      {!isPending && !notifications.length && <NoNotificationsState />}

      {!isPending && recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Recent
          </h2>
          <NotificationList notifications={recent} />
        </section>
      )}

      {!isPending && (older.length > 0 || historyExpanded) && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {historyExpanded ? "History" : "Older"}
          </h2>
          {historyExpanded ? (
            <NotificationHistoryList
              notifications={older}
              fetchNextPage={fetchNextPage}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          ) : (
            <>
              <NotificationList notifications={olderPreview} />
              {hasMoreOlder && (
                <button
                  type="button"
                  onClick={() => setHistoryExpanded(true)}
                  className="self-center rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent"
                >
                  View all
                </button>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default Notifications;
