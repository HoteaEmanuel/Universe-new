import {
  Home,
  Compass,
  MessageCircle,
  PlusSquare,
  Bell,
  Settings,
  CalendarDays,
  BriefcaseBusiness,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SideLink = {
  link: string;
  text: string;
  element?: LucideIcon;
  notification?: boolean;
  newNotification?: boolean;
  hoverAnimation?: string;
};

export const SideLinks: SideLink[] = [
  {
    link: "/home",
    text: "Home",
    element: Home,
    hoverAnimation: "group-hover/menu-button:animate-icon-hop",
  },
  {
    link: "/explore",
    text: "Explore",
    element: Compass,
    hoverAnimation: "group-hover/menu-button:animate-icon-spin-once",
  },
  {
    link: "/chat",
    text: "Chat",
    notification: true,
    element: MessageCircle,
    hoverAnimation: "group-hover/menu-button:animate-icon-wiggle",
  },
  {
    link: "/events",
    text: "Events",
    element: CalendarDays,
    hoverAnimation: "group-hover/menu-button:animate-icon-pop-rotate",
  },
  {
    link: "/opportunities",
    text: "Opportunities",
    element: BriefcaseBusiness,
    hoverAnimation: "group-hover/menu-button:animate-icon-hop",
  },
  {
    link: "/profile",
    text: "Profile",
  },
  {
    link: "/create-post",
    text: "Create post",
    element: PlusSquare,
    hoverAnimation: "group-hover/menu-button:animate-icon-pop-rotate",
  },
  {
    link: "/notifications",
    text: "Notifications",
    element: Bell,
    newNotification: true,
    hoverAnimation: "group-hover/menu-button:animate-icon-ring",
  },
  {
    link: "/settings",
    text: "Settings",
    element: Settings,
    hoverAnimation: "group-hover/menu-button:animate-icon-gear-spin",
  },
];
