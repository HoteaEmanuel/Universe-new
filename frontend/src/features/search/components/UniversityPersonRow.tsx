import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../../store/authStore";
import { useFollowMutation } from "@/queryAndMutation/mutations/user-mutation";
import { getAvatarColorClass, getInitials } from "../../chat/utils/avatarColor";
import { getFullName } from "../../../utils/fullName";
import { urlPathName } from "../../../utils/urlPathFromName";
import type { FollowUser } from "@/queryAndMutation/types";

// Unlike SearchUserRow, the whole row can't be one <button> here - the
// Follow action needs its own click target that doesn't also navigate, so
// it's a sibling to the profile-navigating button rather than nested inside
// it (a nested button is invalid HTML and its click would bubble into
// navigation anyway).
const UniversityPersonRow = ({ user }: { user: FollowUser }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const [justFollowed, setJustFollowed] = useState(false);
  const followMutation = useFollowMutation(user.id, authUser?.id);
  const displayName = getFullName(user);

  return (
    <li className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted">
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate(`/u/${urlPathName(user)}`)}
        className="h-auto min-w-0 flex-1 justify-start gap-3 p-0 text-left hover:bg-transparent"
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={displayName}
            className="size-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full font-medium text-white ${getAvatarColorClass(user.id)}`}
          >
            {getInitials(displayName)}
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-medium">{displayName}</p>
          {user.university && (
            <p className="truncate text-sm text-muted-foreground">
              {user.university}
            </p>
          )}
        </div>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={justFollowed || followMutation.isPending}
        onClick={() =>
          followMutation.mutate(undefined, {
            onSuccess: () => setJustFollowed(true),
          })
        }
        className="pill-follow shrink-0 px-3"
      >
        {justFollowed ? "Following" : "Follow"}
      </Button>
    </li>
  );
};

export default UniversityPersonRow;
