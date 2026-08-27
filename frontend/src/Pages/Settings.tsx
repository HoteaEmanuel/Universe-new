import { Outlet } from "react-router-dom";

const Settings = () => {
  return (
    <div className="flex w-full justify-center">
      <Outlet />
    </div>
  );
};

export default Settings;
