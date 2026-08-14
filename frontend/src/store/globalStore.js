import { create } from "zustand";
import axios from "axios";

const API_URL =
  import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api";

const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  document.getElementById("root")?.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
};

export const useGlobalStore = create((set) => ({
  user: null,
  theme: localStorage.getItem("theme") || "light",
  notificationsOn: true,
  preferencesLoaded: false,
  setUser: (user) => set({ user }),
  getPreferences: async () => {
    const response = await axios.get(`${API_URL}/preferences`);
    const preferences = response.data.preferences;
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
    const preferences = response.data.preferences;
    if (data.theme) applyTheme(preferences.theme);
    set({
      theme: preferences.theme,
      notificationsOn: preferences.notificationsEnabled,
    });
    return preferences;
  },
}));
