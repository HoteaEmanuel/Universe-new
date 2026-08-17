import { useQuery } from "@tanstack/react-query";
import { useGlobalStore } from "../../store/globalStore";
import { useAuthStore } from "../../store/authStore";

export const useGetPreferencesQuery = () => {
  const { getPreferences } = useGlobalStore();
  const { user } = useAuthStore();
  return useQuery({
    queryFn: () => getPreferences(),
    queryKey: ["preferences", user?.id],
    enabled: !!user?.id,
  });
};
