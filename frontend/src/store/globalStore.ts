import { create } from "zustand";

export type Theme = "light" | "dark";

// DOM side effect kept app-local (packages/shared must stay DOM-free) -
// called from the preferences query/mutation hooks whenever fetched or
// updated preferences data includes a theme.
export const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("root")?.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

type GlobalStore = {
  theme: Theme;
  notificationsOn: boolean;
  preferencesLoaded: boolean;
  setPreferences: (data: { theme: Theme; notificationsOn: boolean }) => void;
};

export const useGlobalStore = create<GlobalStore>((set) => ({
  theme: (localStorage.getItem("theme") as Theme | null) || "light",
  notificationsOn: true,
  preferencesLoaded: false,
  setPreferences: ({ theme, notificationsOn }) =>
    set({ theme, notificationsOn, preferencesLoaded: true }),
}));
