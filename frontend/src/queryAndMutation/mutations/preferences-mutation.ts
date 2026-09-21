import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPreferencesApi } from "@universe/shared/api";
import { createPreferenceMutations } from "@universe/shared/mutations";
import { useAuthStore } from "../../store/authStore";
import { applyTheme, useGlobalStore } from "../../store/globalStore";
import { httpClient } from "@/lib/api";

const preferencesApi = createPreferencesApi(httpClient);

export const useUpdatePreferencesMutation = () => {
  const { user } = useAuthStore();
  const setPreferences = useGlobalStore((state) => state.setPreferences);
  const queryClient = useQueryClient();
  const shared = createPreferenceMutations(preferencesApi, queryClient).update(user?.id);
  return useMutation({
    ...shared,
    onSuccess: (data, variables, onMutateResult, context) => {
      shared.onSuccess?.(data, variables, onMutateResult, context);
      // Only re-applies the DOM theme when the update actually touched it,
      // same as the original store-based mutation - avoids an unnecessary
      // localStorage write when only notification settings changed.
      if (variables.theme) applyTheme(data.theme);
      setPreferences({ theme: data.theme, notificationsOn: data.notificationsEnabled });
    },
  });
};
