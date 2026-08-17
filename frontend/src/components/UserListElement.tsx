import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuthStore } from "../store/authStore";
import { urlPathName } from "../utils/urlPathFromName";

type ListedUser = {
  id: string;
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
  return (
    <div
      className="flex hoverGray w-full  rounded-lg cursor-pointer p-2 items-center gap-4"
      onClick={() =>
        user.id === authUser?.id
          ? navigate("/profile")
          : navigate(`/users/${fullName}`)
      }
    >
      {user.profilePicture ? (
        <img src={user.profilePicture} className="size-12 rounded-full" />
      ) : (
        <FaUserCircle className="size-12" />
      )}
      <h1>
        {user.id === authUser?.id ? "You" : user.firstName}{" "}
        {user.id === authUser?.id
          ? ""
          : user.accountType === "normal"
            ? user.lastName
            : user.name}
      </h1>
    </div>
  );
};

export default UserListElement;
