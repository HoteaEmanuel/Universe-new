import React from "react";
import { Link } from "react-router-dom";

const Nav = () => {
  return (
    <nav className="w-1/2 md:w-1/3 flex justify-around">
      <Link
        to={"/signup"}
        className="cursor-pointer text-violet-500 text-sm md:text-lg p-4 rounded-xl hover:bg-linear-to-r  hover:scale-105"
      >
        Sign up
      </Link>
      <Link
        to={"/login"}
        className="cursor-pointer text-violet-500 text-sm md:text-lg p-4 rounded-xl hover:bg-linear-to-r  hover:scale-105"
      >
        Log in
      </Link>
    </nav>
  );
};

export default Nav;
