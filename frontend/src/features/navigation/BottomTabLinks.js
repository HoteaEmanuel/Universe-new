
import { FaHome } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { IoChatboxEllipses } from "react-icons/io5";
import { IoAddCircleSharp } from "react-icons/io5";
import { MdExplore } from "react-icons/md";
export const BottomTabLinks = [
  {
    link: "/home",
    text: "Home",
    element:FaHome
  },
  { link: "/explore", text: "Explore",
    element:MdExplore
   },
  {
    link: "/chat",
    text: "Chat",
    element:IoChatboxEllipses
  },
  
  {
    link: "/create-post",
    text: "Create post",
    element:IoAddCircleSharp
  },
  {
    link:"/settings",
    text:"Settings",
    element:IoMdSettings
  }
];
