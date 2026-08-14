import React from "react";
import { useAuthStore } from "@/store/authStore";
import { FaUserCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
const ProfileCard = () => {
  const { user } = useAuthStore();
  return (
    <div className="flex flex-col w-full  justify-center p-4 rounded-xl">
      <div className="flex items-center">
        <Link to={`/profile`}>
          {(user?.profilePicture && (
            <img
              src={user?.profilePicture}
              alt="user"
              className="w-20 h-20 rounded-full mr-2"
            />
          )) || <FaUserCircle className="w-20 h-20 text-violet-950" />}{" "}
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
