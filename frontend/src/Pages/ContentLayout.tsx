import { Outlet } from "react-router-dom";

const ContentLayout = () => {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-4 md:px-6 md:py-6 min-h-0">
      <Outlet />
    </div>
  );
};

export default ContentLayout;
