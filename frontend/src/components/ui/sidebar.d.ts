import type { ComponentProps, ComponentType, ReactNode } from "react";

type LooseProps = Record<string, unknown> & {
  className?: string;
  children?: ReactNode;
};

export const SidebarProvider: ComponentType<LooseProps>;
export const Sidebar: ComponentType<LooseProps>;
export const SidebarTrigger: ComponentType<LooseProps>;
export const SidebarRail: ComponentType<LooseProps>;
export const SidebarInset: ComponentType<LooseProps>;
export const SidebarInput: ComponentType<ComponentProps<"input">>;
export const SidebarHeader: ComponentType<LooseProps>;
export const SidebarFooter: ComponentType<LooseProps>;
export const SidebarSeparator: ComponentType<LooseProps>;
export const SidebarContent: ComponentType<LooseProps>;
export const SidebarGroup: ComponentType<LooseProps>;
export const SidebarGroupLabel: ComponentType<LooseProps>;
export const SidebarGroupAction: ComponentType<LooseProps>;
export const SidebarGroupContent: ComponentType<LooseProps>;
export const SidebarMenu: ComponentType<LooseProps>;
export const SidebarMenuItem: ComponentType<LooseProps>;
export const SidebarMenuButton: ComponentType<LooseProps>;
export const SidebarMenuAction: ComponentType<LooseProps>;
export const SidebarMenuBadge: ComponentType<LooseProps>;
export const SidebarMenuSkeleton: ComponentType<LooseProps>;
export const SidebarMenuSub: ComponentType<LooseProps>;
export const SidebarMenuSubItem: ComponentType<LooseProps>;
export const SidebarMenuSubButton: ComponentType<LooseProps>;
export function useSidebar(): {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (value: boolean | ((open: boolean) => boolean)) => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (value: boolean) => void;
  toggleSidebar: () => void;
};
