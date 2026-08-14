import PostCard from "../components/PostCard";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useGetPostsInfiniteQuery } from "../queryAndMutation/queries/post-queries";
import { useAuthStore } from "../store/authStore";
import { useState, useRef } from "react";
import { useEffect } from "react";
import { useGetFollowingQuery } from "../queryAndMutation/queries/user-queries";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const FEEDS = ["Global", "Following", "University"];
const SCROLL_FETCH_THRESHOLD = 200;
const ESTIMATED_POST_HEIGHT = 480;

const HomePage = () => {
  useEffect(() => {
    document.title = "Home";
  }, []);
  const { user } = useAuthStore();
  const { isPending: isPendingFollowing } = useGetFollowingQuery(user.id);
  const [feedSelector, setFeedSelector] = useState("Global");
  const scrollRef = useRef(null);

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
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_POST_HEIGHT,
    overscan: 5,
  });

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const distanceFromBottom =
        scrollContainer.scrollHeight -
        scrollContainer.scrollTop -
        scrollContainer.clientHeight;
      if (
        distanceFromBottom < SCROLL_FETCH_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem)] w-full max-w-2xl flex-col overflow-hidden md:h-[calc(100dvh-4rem)]">
      <div className="-mx-4 bg-background px-4 pt-2 pb-3 md:mx-0 md:px-0">
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

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto pb-24 md:pb-10"
      >
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
                  style={{ transform: `translateY(${virtualItem.start}px)` }}
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
    </div>
  );
};

export default HomePage;
