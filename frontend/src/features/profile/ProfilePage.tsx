import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Grid3x3, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "../../store/authStore";
import {
  useGetSavedPostsQuery,
  useGetUserPostsQuery,
} from "../../queryAndMutation/queries/post-queries";
import { useGetUserByNameQuery } from "../../queryAndMutation/queries/user-queries";
import { getFullName } from "../../utils/fullName";
import ProfileHeader from "./ProfileHeader";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileSkeleton from "./ProfileSkeleton";
import type { ProfileUser } from "./types";

const ProfilePage = () => {
  const { name } = useParams();
  const { user: authUser } = useAuthStore() as { user?: ProfileUser };
  const [tab, setTab] = useState<"posts" | "saved">("posts");

  const {
    data: otherUser,
    isPending: isPendingOtherUser,
    isError: isOtherUserError,
  } = useGetUserByNameQuery(name);

  const profileUser: ProfileUser | undefined = name ? otherUser : authUser;
  const isOwnProfile = !!profileUser && profileUser._id === authUser?._id;

  useEffect(() => {
    document.title = profileUser ? getFullName(profileUser) : "Profile";
  }, [profileUser]);

  const { data: posts, isPending: isPendingPosts } = useGetUserPostsQuery(
    profileUser?._id,
  );
  const { data: savedPosts, isPending: isPendingSaved } =
    useGetSavedPostsQuery(authUser?._id ?? "");

  if (name && !isPendingOtherUser && isOtherUserError) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        This user couldn't be found.
      </p>
    );
  }

  if (
    !profileUser ||
    isPendingPosts ||
    (isOwnProfile && tab === "saved" && isPendingSaved)
  ) {
    return <ProfileSkeleton />;
  }

  const activePosts =
    isOwnProfile && tab === "saved" ? (savedPosts ?? []) : (posts ?? []);

  return (
    <div className="flex flex-col gap-8">
      <ProfileHeader
        user={profileUser}
        isOwnProfile={isOwnProfile}
        postsCount={posts?.length ?? 0}
      />

      <div className="border-t border-border">
        {isOwnProfile ? (
          <div className="flex justify-center gap-10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTab("posts")}
              className={cn(
                "h-auto gap-1.5 rounded-none border-t-2 py-3 text-xs font-semibold tracking-wide uppercase hover:bg-transparent",
                tab === "posts"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Grid3x3 className="size-4" />
              Posts
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTab("saved")}
              className={cn(
                "h-auto gap-1.5 rounded-none border-t-2 py-3 text-xs font-semibold tracking-wide uppercase hover:bg-transparent",
                tab === "saved"
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Bookmark className="size-4" />
              Saved
            </Button>
          </div>
        ) : (
          <div className="flex justify-center gap-1.5 border-t-2 border-foreground py-3 text-xs font-semibold tracking-wide text-foreground uppercase">
            <Grid3x3 className="size-4" />
            Posts
          </div>
        )}
      </div>

      <ProfilePostGrid
        posts={activePosts}
        showEditIcon={isOwnProfile && tab === "posts"}
        emptyTitle={tab === "saved" ? "No saved posts yet" : "No posts yet"}
        emptyDescription={
          tab === "saved"
            ? "Posts you save will show up here."
            : isOwnProfile
              ? "Share something with the community."
              : undefined
        }
        showCreateCta={isOwnProfile && tab === "posts"}
      />
    </div>
  );
};

export default ProfilePage;
