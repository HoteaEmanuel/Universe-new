import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGlobalStore } from "../../store/globalStore";
import { useAuthStore } from "../../store/authStore";

export const useUpdatePreferencesMutation = () => {
  const { updatePreferences } = useGlobalStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences", user?.id] });
    },
  });
};
