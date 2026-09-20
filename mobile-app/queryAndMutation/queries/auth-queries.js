import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
export const useGetBusinessRegistrationsQuery = () => {
  const { getBusinessRegistrations } = useAuthStore();
  return useQuery({
    queryFn: async () => await getBusinessRegistrations(),
    queryKey: ["businessRegistrations"],
  });
}