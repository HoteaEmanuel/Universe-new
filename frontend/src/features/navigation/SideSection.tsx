import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, CircleUserRound } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useGlobalStore } from "@/store/globalStore";
import logo from "@/assets/logo_1.png";
import {
  useGetNewMessageNotifications,
  useGetUnreadNotifications,
} from "@/queryAndMutation/queries/notifications-queries";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { SideLinks } from "./SideTabLinks";
import { cn } from "@/lib/utils";
import NotificationBell from "@/features/notifications/NotificationBell";
import CountBadge from "@/components/CountBadge";

const menuButtonClass = cn(
  "cursor-pointer gap-3 text-[15px]",
  "[&_svg]:size-6 group-data-[collapsible=icon]:[&_svg]:size-7",
  "data-active:text-sidebar-accent-foreground",
  "group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:h-14! group-data-[collapsible=icon]:justify-center!"
);

const SideSection = () => {
  const { pathname } = useLocation();
  const { notificationsOn } = useGlobalStore();
  const { user: authUser, logOut } = useAuthStore();
  const user = authUser!;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (
      user.role === "admin" &&
      !SideLinks.some((item) => item.link === "/admin")
    ) {
      SideLinks.splice(5, 0, {
        link: "/admin",
        text: "Admin",
        element: ShieldCheck,
        hoverAnimation: "group-hover/menu-button:animate-icon-shield-pulse",
      });
    }
  }, [user.role]);

  const { data: notifications } = useGetUnreadNotifications(user.id);
  const { data: messageNotifications } = useGetNewMessageNotifications(
    user.id,
  );

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className="contents">
      <Sidebar
        collapsible="icon"
        className="hidden md:block"
        style={{ "--sidebar": "transparent", "--sidebar-width-icon": "4rem" }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        <SidebarHeader>
          <div className="flex w-full items-center gap-2 overflow-hidden group-data-[collapsible=icon]:justify-center">
            <img
              src={logo}
              alt="logo"
              className="size-11 shrink-0 object-contain group-data-[state=collapsed]:size-9"
            />
            <h1 className="gradient-text-light truncate text-2xl group-data-[collapsible=icon]:hidden">
              Universe
            </h1>
          </div>
        </SidebarHeader>

        <SidebarContent className="justify-center">
          <SidebarGroup>
            <SidebarMenu className="gap-2.5">
              {SideLinks.map((item) => {
                const isActive = pathname === item.link;
                const Icon = item.element;

                return (
                  <SidebarMenuItem key={item.link}>
                    <SidebarMenuButton
                      render={<NavLink to={item.link} />}
                      isActive={isActive}
                      size="lg"
                      className={menuButtonClass}
                    >
                      {item.newNotification ? (
                        <NotificationBell
                          icon={Icon}
                          iconClassName={item.hoverAnimation}
                          badgeCount={
                            notificationsOn ? (notifications?.length ?? 0) : 0
                          }
                        />
                      ) : item.text !== "Profile" ? (
                        <div className="relative flex shrink-0">
                          {Icon && <Icon className={item.hoverAnimation} />}
                          {notificationsOn &&
                            item.notification &&
                            (messageNotifications?.length ?? 0) > 0 && (
                              <CountBadge
                                count={messageNotifications?.length ?? 0}
                              />
                            )}
                        </div>
                      ) : user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          className="size-6 shrink-0 rounded-full object-cover group-data-[collapsible=icon]:size-7"
                        />
                      ) : (
                        <CircleUserRound className="shrink-0" />
                      )}
                      <span className="truncate group-data-[collapsible=icon]:hidden">
                        {item.text}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => logOut()}
                size="lg"
                className={cn(menuButtonClass, "hover:text-destructive")}
              >
                <LogOut className="shrink-0" />
                <span className="truncate group-data-[collapsible=icon]:hidden">
                  Log out
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};

export default SideSection;
