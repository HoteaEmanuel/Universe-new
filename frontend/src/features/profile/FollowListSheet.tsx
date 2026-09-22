import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useGetRelevantFollowersInfiniteQuery,
  useGetRelevantFollowingInfiniteQuery,
} from "@/queryAndMutation/queries/user-queries";
import type { FollowUser } from "@/queryAndMutation/types";
import UserListElement from "@/components/UserListElement";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import UserListSkeleton from "@/components/UserListSkeleton";
import SearchInput from "@/components/SearchInput";
import { useDebounce } from "@/hooks/Debounce";
import { findScrollableAncestor } from "@/utils/scroll";

type FollowListSheetProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
  title: "Followers" | "Following";
};

const SCROLL_FETCH_THRESHOLD = 150;
const ESTIMATED_ROW_HEIGHT = 60;

type VirtualizedFollowListProps = {
  users: FollowUser[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

const VirtualizedFollowList = ({
  users,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: VirtualizedFollowListProps) => {
  const scrollRef = useRef<HTMLElement | null>(null);
  const rootRef = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = findScrollableAncestor(node);
  }, []);

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 8,
    getItemKey: (index) => users[index].id,
  });

  useEffect(() => {
    const scrollEl = scrollRef.current;
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
    <div
      ref={rootRef}
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
  );
};

const FollowListSheet = ({
  open,
  onClose,
  userId,
  title,
}: FollowListSheetProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const followersQuery = useGetRelevantFollowersInfiniteQuery(
    open && title === "Followers" ? userId : undefined,
    debouncedSearch,
  );
  const followingQuery = useGetRelevantFollowingInfiniteQuery(
    open && title === "Following" ? userId : undefined,
    debouncedSearch,
  );
  const {
    data,
    isPending: isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = title === "Followers" ? followersQuery : followingQuery;

  const users = data?.pages.flatMap((page) => page.users) ?? [];
  const emptyMessage = debouncedSearch
    ? "No matches found."
    : title === "Followers"
      ? "No followers yet."
      : "Not following anyone yet.";

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Drawer open={open} onOpenChange={(next: boolean) => !next && onClose()}>
        <DrawerContent>
          <DrawerHeader className="border-b border-border pr-12 pb-3">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <SearchInput
            onChange={setSearch}
            value={search}
            className="shrink-0 px-2"
            placeholder={
              title === "Followers"
                ? "Search followers..."
                : "Search following..."
            }
          />
          <DrawerBody className="h-full px-4 pb-4">
            {isLoading && <UserListSkeleton />}
            {!isLoading && users.length === 0 && (
              <p className="pt-8 list-loading-text">{emptyMessage}</p>
            )}
            {open && !isLoading && users.length > 0 && (
              <VirtualizedFollowList
                users={users}
                hasNextPage={!!hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
            )}
            {isFetchingNextPage && (
              <div className="flex items-center gap-3 p-2">
                <Skeleton className="size-12 shrink-0 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default FollowListSheet;
