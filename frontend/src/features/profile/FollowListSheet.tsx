import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useGetRelevantFollowersInfiniteQuery,
  useGetRelevantFollowingInfiniteQuery,
} from "@/queryAndMutation/queries/user-queries";
import UserListElement from "@/components/UserListElement";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type FollowListSheetProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  title: "Followers" | "Following";
};

const SCROLL_FETCH_THRESHOLD = 150;
const ESTIMATED_ROW_HEIGHT = 60;

const FollowListSheet = ({
  open,
  onClose,
  userId,
  title,
}: FollowListSheetProps) => {
  const followersQuery = useGetRelevantFollowersInfiniteQuery(
    open && title === "Followers" ? userId : undefined,
  );
  const followingQuery = useGetRelevantFollowingInfiniteQuery(
    open && title === "Following" ? userId : undefined,
  );
  const {
    data,
    isPending: isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = title === "Followers" ? followersQuery : followingQuery;

  const listRef = useRef<HTMLDivElement>(null);
  const users = data?.pages.flatMap((page) => page.users) ?? [];
  const emptyMessage =
    title === "Followers" ? "No followers yet." : "Not following anyone yet.";

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
    getItemKey: (index) => users[index].id,
  });

  useEffect(() => {
    const scrollEl = listRef.current;
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, users.length]);

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Sheet open={open} onOpenChange={(next: boolean) => !next && onClose()}>
        <SheetContent
          side="bottom"
          className="mx-auto flex max-h-[70vh] w-full flex-col rounded-t-2xl sm:max-w-md"
        >
          <SheetHeader className="border-b border-border pb-3">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-4">
            {isLoading && (
              <ul className="flex flex-col gap-3 pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="size-12 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </li>
                ))}
              </ul>
            )}
            {!isLoading && users.length === 0 && (
              <p className="pt-8 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            )}
            {!isLoading && users.length > 0 && (
              <div
                className="relative pt-1"
                style={{ height: virtualizer.getTotalSize() }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const user = users[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      className="absolute top-0 left-0 w-full"
                      style={{ transform: `translateY(${virtualItem.start}px)` }}
                    >
                      <UserListElement user={user} />
                    </div>
                  );
                })}
              </div>
            )}
            {isFetchingNextPage && (
              <div className="flex items-center gap-3 p-2">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FollowListSheet;
