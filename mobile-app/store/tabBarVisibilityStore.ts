import { create } from "zustand";

type TabBarVisibilityState = {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

// Shared between each dashboard screen's scroll handler (useHideTabBarOnScroll)
// and GlassTabBar, which is the only thing that reads it - the two live in
// different subtrees under expo-router's <Tabs>, so a store is simpler than
// threading the value through navigation props.
export const useTabBarVisibilityStore = create<TabBarVisibilityState>((set) => ({
  hidden: false,
  setHidden: (hidden) => set({ hidden }),
}));
