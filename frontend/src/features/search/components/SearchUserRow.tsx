import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "../../../store/authStore";
import { getAvatarColorClass, getInitials } from "../../chat/utils/avatarColor";
import { getFullName } from "../../../utils/fullName";
import type { ChatUser } from "../../chat/types";

const SearchUserRow = ({ user }: { user: ChatUser }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const isSelf = user.id === authUser!.id;
  const displayName = isSelf ? "You" : getFullName(user);

  // Search results don't carry a username (see search.repository.ts's raw
  // SQL), so a name-derived slug here could 404 or land on the wrong
  // profile for duplicate names - the id always resolves correctly.
  // ProfilePage swaps the url to the canonical /u/<username> once it loads.
  const goToProfile = () => (isSelf ? navigate("/profile") : navigate(`/u/${user.id}`));

  return (
    <li>
      <Button
        type="button"
        variant="ghost"
        onClick={goToProfile}
        className="h-auto w-full justify-start gap-3 rounded-xl p-2 text-left"
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={displayName}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <div
            className={`flex size-12 items-center justify-center rounded-full font-medium text-white ${getAvatarColorClass(user.id)}`}
          >
            {getInitials(getFullName(user))}
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
    </li>
  );
};

export default SearchUserRow;
