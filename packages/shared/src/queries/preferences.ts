import { queryOptions } from "@tanstack/react-query";
import type { createPreferencesApi } from "../api/preferences.js";
import { preferenceKeys } from "./keys.js";

type PreferencesApi = ReturnType<typeof createPreferencesApi>;

export const createPreferenceQueries = (api: PreferencesApi) => ({
  detail: (userId?: string) =>
    queryOptions({
      queryKey: preferenceKeys.detail(userId ?? ""),
      queryFn: () => api.get(),
      enabled: !!userId,
    }),
});
