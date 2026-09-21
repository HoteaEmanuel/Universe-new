import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPreferencesApi } from "@universe/shared/api";
import { createPreferenceQueries } from "@universe/shared/queries";
import { useAuthStore } from "../../store/authStore";
import { applyTheme, useGlobalStore } from "../../store/globalStore";
import { httpClient } from "@/lib/api";

const preferencesApi = createPreferencesApi(httpClient);
const preferenceQueries = createPreferenceQueries(preferencesApi);

// The fetched preferences used to live only in `globalStore` (set as a side
// effect inside its own `getPreferences` axios call); now that the fetch is
// a real query, this effect keeps that same store in sync with the
// resolved data, so the ~5 components reading `theme`/`notificationsOn`
// synchronously off `useGlobalStore()` (sidebar badge, socket listener,
// settings pages) don't need to change.
export const useGetPreferencesQuery = () => {
  const { user } = useAuthStore();
  const setPreferences = useGlobalStore((state) => state.setPreferences);
  const query = useQuery(preferenceQueries.detail(user?.id));

  useEffect(() => {
    if (!query.data) return;
    applyTheme(query.data.theme);
    setPreferences({ theme: query.data.theme, notificationsOn: query.data.notificationsEnabled });
  }, [query.data, setPreferences]);

  return query;
};
