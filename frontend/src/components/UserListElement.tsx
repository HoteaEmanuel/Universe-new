import { useNavigate } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";
import { useAuthStore } from "../store/authStore";
import { urlPathName } from "../utils/urlPathFromName";
import { getFullName } from "@/utils/fullName";

type ListedUser = {
  id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
  accountType?: string;
};

const UserListElement = ({ user }: { user: ListedUser }) => {
  const navigate = useNavigate();
  const { user: authUser } = useAuthStore();
  const fullName = urlPathName(user);
  const displayName = user.id === authUser?.id ? "You" : getFullName(user);

  return (
    <div
      className="flex hoverGray w-full  rounded-lg cursor-pointer p-2 items-center gap-4"
      onClick={() =>
        user.id === authUser?.id
          ? navigate("/profile")
          : navigate(`/u/${fullName}`)
      }
    >
      <UserAvatar
        user={user}
        name={displayName}
        className="size-12"
        fallbackClassName="text-foreground"
      />
      <h1>{displayName}</h1>
    </div>
  );
};

export default UserListElement;
