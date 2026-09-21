import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { createPreferencesApi } from "../api/preferences.js";
import type { UpdatePreferencesPayload } from "../preferences.js";
import { preferenceKeys } from "../queries/keys.js";

type PreferencesApi = ReturnType<typeof createPreferencesApi>;

export const createPreferenceMutations = (api: PreferencesApi, queryClient: QueryClient) => ({
  update: (userId?: string) =>
    mutationOptions({
      mutationFn: (data: UpdatePreferencesPayload) => api.update(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: preferenceKeys.detail(userId ?? "") });
      },
    }),
});
