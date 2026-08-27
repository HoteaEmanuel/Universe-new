import { useAuthStore } from "@/store/authStore";
import { Link } from "react-router-dom";
import UserAvatar from "@/components/UserAvatar";

const ProfileCard = () => {
  const { user } = useAuthStore();
  return (
    <div className="flex flex-col w-full  justify-center p-4 rounded-xl">
      <div className="flex items-center">
        <Link to={`/profile`}>
          <UserAvatar user={user} className="size-20 mr-2" />
        </Link>
        <div>
          <p className="text-sm px-2">
            {user?.university || "No university specified"}
          </p>
          <h1 className="text-lg lg:text-2xl font-semibold p-2">
            {user?.firstName || user?.name || "User"}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
