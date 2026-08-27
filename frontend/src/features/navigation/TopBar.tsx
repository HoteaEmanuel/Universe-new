import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import UserAvatar from "@/components/UserAvatar";
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
          <UserAvatar user={user} className="size-10" />
        </Link>
      </div>
    </section>
  );
};

export default TopBar;
