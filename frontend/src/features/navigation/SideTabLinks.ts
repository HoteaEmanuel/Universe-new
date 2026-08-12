import {
  Home,
  Compass,
  MessageCircle,
  PlusSquare,
  Bell,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SideLink = {
  link: string;
  text: string;
  element?: LucideIcon;
  notification?: boolean;
  newNotification?: boolean;
};

export const SideLinks: SideLink[] = [
  {
    link: "/home",
    text: "Home",
    element: Home,
  },
  { link: "/explore", text: "Explore", element: Compass },
  {
    link: "/chat",
    text: "Chat",
    notification: true,
    element: MessageCircle,
  },
  {
    link: "/profile",
    text: "Profile",
  },
  {
    link: "/create-post",
    text: "Create post",
    element: PlusSquare,
  },
  {
    link: "/notifications",
    text: "Notifications",
    element: Bell,
    newNotification: true,
  },
  {
    link: "/settings",
    text: "Settings",
    element: Settings,
  },
];
