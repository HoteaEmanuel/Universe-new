import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPreferencesApi } from "@universe/shared/api";
import { createPreferenceMutations } from "@universe/shared/mutations";
import { useAuthStore } from "@store/authStore";
import { useThemeStore } from "@store/themeStore";
import { httpClient } from "@lib/http";

const preferencesApi = createPreferencesApi(httpClient);

export const useUpdatePreferencesMutation = () => {
  const userId = useAuthStore((state) => state.user?.id as string | undefined);
  const setPreferenceColorScheme = useThemeStore((state) => state.setPreferenceColorScheme);
  const queryClient = useQueryClient();
  const shared = createPreferenceMutations(preferencesApi, queryClient).update(userId);
  return useMutation({
    ...shared,
    onSuccess: (data, variables, onMutateResult, context) => {
      shared.onSuccess?.(data, variables, onMutateResult, context);
      // Only re-applies the theme override when the update actually touched
      // it, matching frontend's mutation (avoids a pointless SecureStore
      // write when only notification settings changed).
      if (variables.theme) setPreferenceColorScheme(data.theme);
    },
  });
};
