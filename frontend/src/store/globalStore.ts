import { create } from "zustand";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";

export type Theme = "light" | "dark";

export type Preferences = {
  theme: Theme;
  notificationsEnabled: boolean;
};

export type UpdatePreferencesPayload = Partial<Preferences>;

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("root")?.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

type GlobalStore = {
  theme: Theme;
  notificationsOn: boolean;
  preferencesLoaded: boolean;
  getPreferences: () => Promise<Preferences>;
  updatePreferences: (data: UpdatePreferencesPayload) => Promise<Preferences>;
};

export const useGlobalStore = create<GlobalStore>((set) => ({
  theme: (localStorage.getItem("theme") as Theme | null) || "light",
  notificationsOn: true,
  preferencesLoaded: false,
  getPreferences: async () => {
    const response = await axios.get(`${API_URL}/preferences`);
    const preferences: Preferences = response.data.preferences;
    applyTheme(preferences.theme);
    set({
      theme: preferences.theme,
      notificationsOn: preferences.notificationsEnabled,
      preferencesLoaded: true,
    });
    return preferences;
  },
  updatePreferences: async (data) => {
    const response = await axios.patch(`${API_URL}/preferences`, data);
    const preferences: Preferences = response.data.preferences;
    if (data.theme) applyTheme(preferences.theme);
    set({
      theme: preferences.theme,
      notificationsOn: preferences.notificationsEnabled,
    });
    return preferences;
  },
}));
