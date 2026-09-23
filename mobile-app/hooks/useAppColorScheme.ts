import { useThemeStore } from "@store/themeStore";

// Replaces React Native's raw useColorScheme() everywhere in the app: reads
// the resolved scheme (the user's saved preference once one is loaded,
// otherwise the OS scheme) from themeStore instead of the system directly,
// so the Appearance settings toggle actually re-themes every screen.
export const useAppColorScheme = () => useThemeStore((state) => state.colorScheme);
