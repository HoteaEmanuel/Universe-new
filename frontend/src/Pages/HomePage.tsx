import PostCard from "@/features/posts/components/PostCard";
import PostSkeleton from "@/features/posts/components/PostSkeleton";
import { useGetPostsInfiniteQuery } from "../queryAndMutation/queries/post-queries";
import { useAuthStore } from "../store/authStore";
import { useState, useRef, useEffect, useCallback } from "react";
import { useGetFollowingQuery } from "../queryAndMutation/queries/user-queries";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { findScrollableAncestor } from "@/utils/scroll";

const FEEDS = ["Global", "Following", "University"];
const SCROLL_FETCH_THRESHOLD = 200;
const ESTIMATED_POST_HEIGHT = 480;

const HomePage = () => {
  useEffect(() => {
    document.title = "Home";
  }, []);
  const { user } = useAuthStore();
  const { isPending: isPendingFollowing } = useGetFollowingQuery(user?.id);
  const [feedSelector, setFeedSelector] = useState("Global");

  // HomePage doesn't own a scroll container - RootLayout's <section> around
  // the routed page is what actually scrolls - found at runtime the same way
  // EventsPage/Notifications/CommentsContainer do, rather than assuming a
  // fixed DOM structure.
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  // The list isn't alone in the scroll container - the feed-selector pills
  // sit above it - so the virtualizer needs that offset (scrollMargin) or
  // its item positions are computed relative to the whole page instead of
  // relative to this list.
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

  const {
    data,
    isPending: isPendingPosts,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetPostsInfiniteQuery(feedSelector);

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  const virtualizer = useVirtualizer({
    count: posts.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ESTIMATED_POST_HEIGHT,
    overscan: 5,
    scrollMargin,
  });

  useEffect(() => {
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
      if (
        distanceFromBottom < SCROLL_FETCH_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, posts.length]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-24 md:px-0 md:pb-10">
      <div className="pt-2 pb-3">
        <div className="inline-flex rounded-full bg-muted p-1">
          {FEEDS.map((feed) => (
            <button
              key={feed}
              onClick={() => setFeedSelector(feed)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                feedSelector === feed
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {feed}
            </button>
          ))}
        </div>
      </div>

      {(isPendingPosts || isPendingFollowing) && (
        <div className="flex flex-col gap-6">
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}

      {!isPendingPosts && !isPendingFollowing && posts.length === 0 && (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground">
            {feedSelector === "Following"
              ? "Follow people to see their posts here."
              : "Be the first to share something."}
          </p>
        </div>
      )}

      {!isPendingPosts && !isPendingFollowing && posts.length > 0 && (
        <div
          ref={listRef}
          style={{ height: virtualizer.getTotalSize() }}
          className="relative"
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const post = posts[virtualItem.index];
            return (
              <div
                key={post.id}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full pb-6"
                style={{ transform: `translateY(${virtualItem.start - scrollMargin}px)` }}
              >
                <PostCard post={post} />
              </div>
            );
          })}
        </div>
      )}

      {isFetchingNextPage && (
        <Loader2 className="mx-auto mt-6 size-5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
};

export default HomePage;
