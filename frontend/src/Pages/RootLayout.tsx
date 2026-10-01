import { Outlet } from "react-router-dom";
import SideSection from "../features/navigation/SideSection";
import TopBar from "../features/navigation/TopBar";
import BottomBar from "../features/navigation/BottomBar";
import NotificationSocketListener from "../features/notifications/NotificationSocketListener";
import { useGetPreferencesQuery } from "../queryAndMutation/queries/preferences-queries";

const RootLayout = () => {
  useGetPreferencesQuery();
  return (
    <div className="flex h-screen w-full flex-col md:flex-row">
      <NotificationSocketListener />
      <TopBar />
      <SideSection />
      <section className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto pb-16 md:w-2/3 md:pb-0">
        <Outlet />
      </section>

      <BottomBar />
    </div>
  );
};

export default RootLayout;
