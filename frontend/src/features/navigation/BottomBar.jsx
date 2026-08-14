import { NavLink } from "react-router-dom";
import { BottomTabLinks } from "./BottomTabLinks";
import { useLocation } from "react-router-dom";
const BottomBar = () => {
  const path = useLocation();
  return (
    <div className="absolute flex items-center justify-center w-full h-20 shadow md:hidden bottom-0 theme ">
      <ul className="flex w-full justify-around">
        {BottomTabLinks.map((item) => {
          const isActive = path.pathname === item.link;
          return (
            <li key={item.link}>
              <NavLink to={item.link}>
                <div
                  className={`flex flex-col items-center gap-1 p-4 violet mobile-hover ${
                    isActive ? "active" : undefined
                  }`}
                >
                  <item.element />
                  {item.text}
                </div>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BottomBar;
