import { NavLink, useLocation } from "react-router-dom";
import { BottomTabLinks } from "./BottomTabLinks";

const BottomBar = () => {
  const { pathname } = useLocation();

  return (
    <nav className="theme fixed inset-x-0 bottom-0 z-20 flex h-16 items-center justify-around gap-1 border-t border-gray-200 px-2 shadow md:hidden dark:border-gray-800">
      {BottomTabLinks.map((item) => {
        const isActive = pathname === item.link;
        const Icon = item.element;

        return (
          <NavLink
            key={item.link}
            to={item.link}
            className={`flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-300 ease-out ${
              isActive
                ? "active flex-[1.6] gap-1.5 px-3"
                : "flex-1 gap-0 px-0 text-gray-400 hover:text-violet-500 dark:text-gray-600"
            }`}
          >
            <Icon className="size-5 shrink-0" />
            {isActive && (
              <span className="truncate text-xs font-semibold">
                {item.text}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomBar;
