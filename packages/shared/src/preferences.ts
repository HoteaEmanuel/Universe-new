export type Theme = "light" | "dark";

export type Preferences = {
  theme: Theme;
  notificationsEnabled: boolean;
};

export type UpdatePreferencesPayload = Partial<Preferences>;
