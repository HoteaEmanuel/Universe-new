import { create } from "zustand";

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

const getSystemTheme = (): Theme =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyThemeToDom = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("root")?.setAttribute("data-theme", theme);
};

type GlobalStore = {
  theme: Theme;
 
  themeIsExplicit: boolean;
  notificationsOn: boolean;
  preferencesLoaded: boolean;
  
  setPreferences: (data: { theme: Theme | null; notificationsOn: boolean }) => void;
};

const cachedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
const initialTheme = cachedTheme ?? getSystemTheme();
applyThemeToDom(initialTheme);

export const useGlobalStore = create<GlobalStore>((set) => ({
  theme: initialTheme,
  themeIsExplicit: cachedTheme !== null,
  notificationsOn: true,
  preferencesLoaded: false,
  setPreferences: ({ theme, notificationsOn }) => {
    if (theme) {
      applyThemeToDom(theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      set({ theme, themeIsExplicit: true, notificationsOn, preferencesLoaded: true });
    } else {
      set({ notificationsOn, preferencesLoaded: true });
    }
  },
}));


if (typeof window !== "undefined" && window.matchMedia) {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      if (useGlobalStore.getState().themeIsExplicit) return;
      const theme: Theme = event.matches ? "dark" : "light";
      applyThemeToDom(theme);
      useGlobalStore.setState({ theme });
    });
}
