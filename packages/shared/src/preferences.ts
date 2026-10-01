export type Theme = "light" | "dark";

export type Preferences = {
  // null means the user has never explicitly chosen a theme - clients
  // should fall back to the OS preference instead of defaulting to light.
  theme: Theme | null;
  notificationsEnabled: boolean;
};

export type UpdatePreferencesPayload = Partial<Preferences>;
