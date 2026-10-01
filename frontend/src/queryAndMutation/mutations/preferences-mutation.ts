import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPreferencesApi } from "@universe/shared/api";
import { createPreferenceMutations } from "@universe/shared/mutations";
import { useAuthStore } from "../../store/authStore";
import { useGlobalStore } from "../../store/globalStore";
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
      // setPreferences applies the DOM theme + localStorage write itself
      // whenever theme is non-null, which it always is here since this is
      // the user explicitly choosing one.
      setPreferences({ theme: data.theme, notificationsOn: data.notificationsEnabled });
    },
  });
};
