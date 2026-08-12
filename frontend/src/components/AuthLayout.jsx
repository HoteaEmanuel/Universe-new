import React from "react";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="relative">
      <Header transparent className="absolute inset-x-0 top-0 z-20" />
      <Outlet />
    </div>
  );
};

export default AuthLayout;
