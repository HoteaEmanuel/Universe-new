import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Grid3x3, Bookmark, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import NotFoundState from "../../components/NotFoundState";
import { useAuthStore } from "../../store/authStore";
import {
  useGetSavedPostsQuery,
  useGetUserPostsQuery,
} from "../../queryAndMutation/queries/post-queries";
import {
  useGetUserByIdQuery,
  useGetUserByUsernameQuery,
} from "../../queryAndMutation/queries/user-queries";
import { getFullName } from "../../utils/fullName";
import ProfileHeader from "./ProfileHeader";
import ProfilePostGrid from "./ProfilePostGrid";
import ProfileSkeleton from "./ProfileSkeleton";
import type { ProfileUser } from "./types";

// User ids are UUIDs, which can never match USERNAME_PATTERN
// (/^[a-z0-9_]{3,30}$/ - no hyphens) - so the two can't collide and the
// route param's shape alone safely tells us which lookup to use.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { username: routeParam } = useParams();
  const { user: authUser } = useAuthStore() as { user?: ProfileUser };
  const [tab, setTab] = useState<"posts" | "saved">("posts");

  // Search results don't always carry a username (see search.repository.ts's
  // raw-SQL select), so Explore links to a profile by id instead - that id
  // arrives here in the same route param a username would.
  const isIdParam = !!routeParam && UUID_PATTERN.test(routeParam);

  const {
    data: userByUsername,
    isPending: isPendingByUsername,
    isError: isUsernameError,
  } = useGetUserByUsernameQuery(isIdParam ? undefined : routeParam);
  const {
    data: userById,
    isPending: isPendingById,
    isError: isIdError,
  } = useGetUserByIdQuery(isIdParam ? routeParam : undefined);

  const otherUser = isIdParam ? userById : userByUsername;
  const isPendingOtherUser = isIdParam ? isPendingById : isPendingByUsername;
  const isOtherUserError = isIdParam ? isIdError : isUsernameError;

  // Once an id-based lookup resolves, swap the address bar to the canonical
  // /u/<username> url so the profile stays shareable/bookmarkable.
  useEffect(() => {
    if (isIdParam && userById?.username) {
      navigate(`/u/${userById.username}`, { replace: true });
    }
  }, [isIdParam, userById, navigate]);

  const profileUser: ProfileUser | undefined = routeParam ? otherUser : authUser;
  const isOwnProfile = !!profileUser && profileUser.id === authUser?.id;

  useEffect(() => {
    document.title = profileUser ? getFullName(profileUser) : "Profile";
  }, [profileUser]);

  const { data: posts, isPending: isPendingPosts } = useGetUserPostsQuery(
    profileUser?.id,
  );
  const { data: savedPosts, isPending: isPendingSaved } =
    useGetSavedPostsQuery(authUser?.id ?? "");

  if (routeParam && !isPendingOtherUser && isOtherUserError) {
    return (
      <NotFoundState
        icon={UserX}
        title="User not found"
        description="This profile doesn't exist or may have been removed."
      />
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
    <div className="flex flex-col gap-8 pb-20 md:pb-0">
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
        emptyTitle={
          tab === "saved" ? (
            "No saved posts yet"
          ) : isOwnProfile ? (
            <>
              Give this space some{" "}
              <span className="italic font-black text-amber-500 dark:text-amber-400">
                life
              </span>
            </>
          ) : (
            "Still connecting the dots"
          )
        }
        emptyDescription={
          tab === "saved"
            ? "Posts you save will show up here."
            : isOwnProfile
              ? "You don't need the perfect post — just something real."
              : "Nothing has been shared here yet."
        }
        showCreateCta={isOwnProfile && tab === "posts"}
        emptyIllustration={
          tab === "posts"
            ? isOwnProfile
              ? "student-life"
              : "constellation"
            : undefined
        }
      />
    </div>
  );
};

export default ProfilePage;
