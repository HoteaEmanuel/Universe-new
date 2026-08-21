import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { getAvatarColorClass, getInitials } from "../../chat/utils/avatarColor";
import { getFullName } from "../../../utils/fullName";
import { urlPathName } from "../../../utils/urlPathFromName";
import type { ChatUser } from "../../chat/types";

const SearchUserRow = ({ user }: { user: ChatUser }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const isSelf = user.id === authUser!.id;
  const displayName = isSelf ? "You" : getFullName(user);

  const goToProfile = () =>
    isSelf ? navigate("/profile") : navigate(`/u/${urlPathName(user)}`);

  return (
    <li>
      <button
        type="button"
        onClick={goToProfile}
        className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted cursor-pointer"
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
      </button>
    </li>
  );
};

export default SearchUserRow;
