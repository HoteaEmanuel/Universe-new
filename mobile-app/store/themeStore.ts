import { create } from "zustand";
import { Appearance } from "react-native";
import * as SecureStore from "expo-secure-store";

export type AppColorScheme = "light" | "dark";

const THEME_STORAGE_KEY = "themePreference";

const systemColorScheme = (): AppColorScheme => (Appearance.getColorScheme() === "dark" ? "dark" : "light");

type ThemeState = {
  colorScheme: AppColorScheme;
  // True once a saved user preference (local cache or server) is in effect -
  // from then on the OS scheme is ignored until the user changes it again.
  overridden: boolean;
  // True once the SecureStore read below has resolved (or found nothing) -
  // lets the root layout hold the first render until it knows whether a
  // cached preference exists, avoiding a light/dark flash on cold start.
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSystemColorScheme: (scheme: AppColorScheme) => void;
  setPreferenceColorScheme: (scheme: AppColorScheme) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  colorScheme: systemColorScheme(),
  overridden: false,
  hydrated: false,

  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      set({ colorScheme: stored, overridden: true });
    }
    set({ hydrated: true });
  },

  setSystemColorScheme: (scheme) => {
    if (get().overridden) return;
    set({ colorScheme: scheme });
  },

  setPreferenceColorScheme: (scheme) => {
    set({ colorScheme: scheme, overridden: true });
    SecureStore.setItemAsync(THEME_STORAGE_KEY, scheme).catch(() => {});
  },
}));
