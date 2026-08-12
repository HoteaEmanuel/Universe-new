import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import SideSection from "../features/navigation/SideSection";
import TopBar from "../components/TopBar";
import BottomBar from "../components/BottomBar";

const RootLayout = () => {
  return (
      <div className=" block md:flex w-full max-h-screen">
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
