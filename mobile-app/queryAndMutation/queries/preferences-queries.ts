import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPreferencesApi } from "@universe/shared/api";
import { createPreferenceQueries } from "@universe/shared/queries";
import { useAuthStore } from "@store/authStore";
import { useThemeStore } from "@store/themeStore";
import { httpClient } from "@lib/http";

const preferencesApi = createPreferencesApi(httpClient);
const preferenceQueries = createPreferenceQueries(preferencesApi);

// Mirrors frontend's useGetPreferencesQuery: fetched preferences drive the
// theme override (themeStore) as a side effect, so the ~handful of screens
// reading the resolved color scheme via useAppColorScheme() stay in sync
// without each of them needing to know a fetch happened.
export const useGetPreferencesQuery = () => {
  const userId = useAuthStore((state) => state.user?.id as string | undefined);
  const setPreferenceColorScheme = useThemeStore((state) => state.setPreferenceColorScheme);
  const query = useQuery(preferenceQueries.detail(userId));

  useEffect(() => {
    // theme is null when the user has never explicitly chosen one (see
    // Preferences in packages/shared) - leave the current OS-derived scheme
    // alone instead of forcing an override.
    if (!query.data?.theme) return;
    setPreferenceColorScheme(query.data.theme);
  }, [query.data, setPreferenceColorScheme]);

  return query;
};
