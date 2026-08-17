import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGlobalStore } from "../../store/globalStore";
import { useAuthStore } from "../../store/authStore";
import type { UpdatePreferencesPayload } from "../../store/globalStore";

export const useUpdatePreferencesMutation = () => {
  const { updatePreferences } = useGlobalStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePreferencesPayload) => updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences", user?.id] });
    },
  });
};
