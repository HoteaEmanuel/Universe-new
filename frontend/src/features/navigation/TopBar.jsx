import React from "react";
import Logo from "@/components/Logo";
import { Link } from "react-router-dom";
import { CiLogout } from "react-icons/ci";
import { FaUserCircle } from "react-icons/fa";
import { useAuthStore } from "@/store/authStore";
import { MdDarkMode, MdLightMode } from "react-icons/md";
const TopBar = () => {
  const { user } = useAuthStore();
  return (
    <section className=" md:hidden  flex justify-between items-center shadow-md p-2">
      <div className="w-1/2 flex items-center md:w-1/3 gap-0">
        {" "}
        <Link to={"/home"}>
          <img src="./images/academic_orbit_logo.svg" alt="logo" className="w-18 h-20" />
        </Link>
        <h1 className="text-lg gradient-text-light md:text-xl px-2">
          Universe
        </h1>
      </div>

      <div className="flex items-center gap-5">
        <Link to={`/profile`}>
          {user.profilePicture ? (
            <img
              src={user?.profilePicture}
              alt="user profile picture"
              className="size-10 rounded-full"
            />
          ) : (
            <FaUserCircle className="h-10 w-8 text-violet-950" />
          )}
        </Link>
        {/* <Link to="/logout">
          <CiLogout className="h-8 w-10 text-violet-950 font-bold m-2 float-right" />
        </Link> */}
      </div>
    </section>
  );
};

export default TopBar;
