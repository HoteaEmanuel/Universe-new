import { Link } from "react-router-dom";
import logo from "@/assets/logo_1.png";

const TopBar = () => {
  return (
    <section className=" md:hidden  flex items-center shadow-md p-2">
      <div className="w-1/2 flex items-center md:w-1/3 gap-0">
        {" "}
        <Link to={"/home"}>
          <img src={logo} alt="logo" className="size-11 shrink-0 object-contain" />
        </Link>
        <h1 className="text-lg gradient-text-light md:text-xl px-2">
          Universe
        </h1>
      </div>
    </section>
  );
};

export default TopBar;
