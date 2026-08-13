import PostCard from "../components/PostCard";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useGetPostsQuery } from "../queryAndMutation/queries/post-queries";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import { useEffect } from "react";
import { useGetFollowingQuery } from "../queryAndMutation/queries/user-queries";
import { cn } from "@/lib/utils";

const FEEDS = ["Global", "Following", "University"];

const HomePage = () => {
  useEffect(() => {
    document.title = "Home";
  }, []);
  const { user } = useAuthStore();
  const { isPending: isPendingFollowing } = useGetFollowingQuery(user._id);
  const [feedSelector, setFeedSelector] = useState("Global");

  const { data: posts, isPending: isPendingPosts } =
    useGetPostsQuery(feedSelector);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-24 md:pb-10">
      <div className="sticky top-0 z-10 -mx-4 mb-6 bg-background/80 px-4 pt-2 pb-3 backdrop-blur-md md:mx-0 md:px-0">
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

      {!isPendingPosts && !isPendingFollowing && posts?.length === 0 && (
        <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">No posts yet</p>
          <p className="text-sm text-muted-foreground">
            {feedSelector === "Following"
              ? "Follow people to see their posts here."
              : "Be the first to share something."}
          </p>
        </div>
      )}

      {!isPendingPosts && !isPendingFollowing && posts?.length > 0 && (
        <ul className="flex flex-col gap-6">
          {posts.map((post) => (
            <li key={post._id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HomePage;
