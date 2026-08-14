import { Outlet } from "react-router-dom";
import SideSection from "../features/navigation/SideSection";
import TopBar from "../features/navigation/TopBar";
import BottomBar from "../features/navigation/BottomBar";
import NotificationSocketListener from "../features/notifications/NotificationSocketListener";

const RootLayout = () => {
  return (
      <div className=" block md:flex w-full max-h-screen">
        <NotificationSocketListener />
        <TopBar />
        <SideSection />
        <section className="flex flex-col flex-1 md:w-2/3 w-screen h-screen overflow-y-auto">
          <Outlet />
        </section>

        <BottomBar />
      </div>
  );
};

export default RootLayout;
