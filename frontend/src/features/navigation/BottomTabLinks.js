
import { FaHome } from "react-icons/fa";
import { IoChatboxEllipses } from "react-icons/io5";
import { IoAddCircleSharp } from "react-icons/io5";
import { MdExplore, MdEvent, MdWork } from "react-icons/md";
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
    link: "/events",
    text: "Events",
    element:MdEvent
  },
  {
    link: "/opportunities",
    text: "Jobs",
    element: MdWork
  },
  {
    link: "/create-post",
    text: "Create post",
    element:IoAddCircleSharp
  },
];
