import { Outlet } from "react-router-dom";

const ContentLayout = () => {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-6 md:py-6">
      <Outlet />
    </div>
  );
};

export default ContentLayout;
