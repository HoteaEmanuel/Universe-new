import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Camera,
  Flag,
  GraduationCap,
  BookOpen,
  MessageCircle,
  Link2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReportDialog from "@/features/moderation/components/ReportDialog";
import UserAvatar from "@/components/UserAvatar";
import { getFullName } from "@/utils/fullName";
import { useAuthStore } from "@/store/authStore";
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
  useIsFollowingQuery,
} from "@/queryAndMutation/queries/user-queries";
import { useGetConversationByUsersIdsQuery } from "@/queryAndMutation/queries/conversation-queries";
import {
  useFollowMutation,
  useUnfollowMutation,
} from "@/queryAndMutation/mutations/user-mutation";
import ProfileImageModal from "@/Modals/ProfileImageModal";
import FollowListSheet from "./FollowListSheet";
import type { ProfileUser } from "./types";

type ProfileHeaderProps = {
  user: ProfileUser;
  isOwnProfile: boolean;
  postsCount: number;
};

const ProfileHeader = ({
  user,
  isOwnProfile,
  postsCount,
}: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const [openImageModal, setOpenImageModal] = useState(false);
  const [followListOpen, setFollowListOpen] = useState<
    "followers" | "following" | null
  >(null);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const { data: followers } = useGetFollowersQuery(user.id);
  const { data: following } = useGetFollowingQuery(user.id);

  const { data: isFollowing } = useIsFollowingQuery(
    isOwnProfile ? undefined : user.id,
  );
  const { data: conversation } = useGetConversationByUsersIdsQuery(
    isOwnProfile ? undefined : user.id,
  );
  const followMutation = useFollowMutation(user.id, authUser!.id);
  const unfollowMutation = useUnfollowMutation(user.id, authUser!.id);

  const handleMessageClick = () => {
    if (conversation) {
      navigate(`/conversations/${conversation.id}`);
    } else {
      navigate(`/new-conversation/${user.id}`);
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/u/${user.username}`;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        // user dismissed the native share sheet
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Profile link copied");
  };

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">
      <div className="group/avatar relative shrink-0">
        <UserAvatar
          user={user}
          className="size-24 ring-1 ring-border sm:size-28"
        />
        {isOwnProfile && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  aria-label="Change profile picture"
                  onClick={() => setOpenImageModal(true)}
                  className="absolute inset-0 size-full rounded-full bg-black/0 p-0 text-transparent hover:bg-black/40 hover:text-white"
                />
              }
            >
              <Camera className="size-6" />
            </TooltipTrigger>
            <TooltipContent>Change profile picture</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex w-full flex-1 flex-col items-center gap-3 sm:items-start">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
          {user.accountType === "business" && (
            <img
              src="/images/verify.png"
              alt="Verified"
              className="size-5"
            />
          )}
          <h1 className="text-xl font-semibold">{getFullName(user)}</h1>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="font-semibold">{postsCount}</span>
            <span className="text-muted-foreground">
              {postsCount === 1 ? "post" : "posts"}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-1.5 p-0 text-sm hover:bg-transparent"
            onClick={() => setFollowListOpen("followers")}
          >
            <span className="font-semibold">{followers?.length ?? 0}</span>
            <span className="text-muted-foreground">followers</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-auto gap-1.5 p-0 text-sm hover:bg-transparent"
            onClick={() => setFollowListOpen("following")}
          >
            <span className="font-semibold">{following?.length ?? 0}</span>
            <span className="text-muted-foreground">following</span>
          </Button>
        </div>

        {(user.university || user.major) && (
          <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground sm:items-start">
            {user.university && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5" />
                {user.university}
              </span>
            )}
            {user.major && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3.5" />
                {user.major}
              </span>
            )}
          </div>
        )}

        {user.bio && (
          <p className="max-w-md text-center text-sm sm:text-left">
            {user.bio}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          {isOwnProfile ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile/edit-profile")}
            >
              Edit profile
            </Button>
          ) : (
            <>
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={() =>
                  isFollowing
                    ? unfollowMutation.mutate()
                    : followMutation.mutate()
                }
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      aria-label="Message"
                      onClick={handleMessageClick}
                    />
                  }
                >
                  <MessageCircle />
                </TooltipTrigger>
                <TooltipContent>Message</TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Share profile"
                  onClick={handleShareProfile}
                />
              }
            >
              <Link2 />
            </TooltipTrigger>
            <TooltipContent>Share profile</TooltipContent>
          </Tooltip>
          {!isOwnProfile && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <DropdownMenuTrigger
                      render={
                        <Button variant="outline" size="icon-sm" aria-label="Profile options" />
                      }
                    />
                  }
                >
                  <MoreVertical />
                </TooltipTrigger>
                <TooltipContent>Profile options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag />
                  Report account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <ProfileImageModal
          open={openImageModal}
          onClose={() => setOpenImageModal(false)}
          entityType="user"
          currentImageUrl={user.profilePicture}
        />
      )}

      <FollowListSheet
        open={followListOpen === "followers"}
        onClose={() => setFollowListOpen(null)}
        userId={user.id}
        title="Followers"
      />
      <FollowListSheet
        open={followListOpen === "following"}
        onClose={() => setFollowListOpen(null)}
        userId={user.id}
        title="Following"
      />

      {!isOwnProfile && (
        <ReportDialog
          open={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          targetType="user_profile"
          targetId={user.id}
        />
      )}
    </div>
  );
};

export default ProfileHeader;
