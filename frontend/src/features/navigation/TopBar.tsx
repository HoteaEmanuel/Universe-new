import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { useAuthStore } from "@/store/authStore";
import logo from "@/assets/logo_1.png";

const TopBar = () => {
  const { user } = useAuthStore();
  return (
    <section className=" md:hidden  flex justify-between items-center shadow-md p-2">
      <div className="w-1/2 flex items-center md:w-1/3 gap-0">
        {" "}
        <Link to={"/home"}>
          <img src={logo} alt="logo" className="size-11 shrink-0 object-contain" />
        </Link>
        <h1 className="text-lg gradient-text-light md:text-xl px-2">
          Universe
        </h1>
      </div>

      <div className="flex items-center gap-5">
        <Link to={`/profile`}>
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt="user profile picture"
              className="size-10 rounded-full"
            />
          ) : (
            <FaUserCircle className="h-10 w-8 text-violet-950" />
          )}
        </Link>
      </div>
    </section>
  );
};

export default TopBar;
