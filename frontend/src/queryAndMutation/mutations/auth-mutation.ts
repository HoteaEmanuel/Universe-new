import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";

export const useVerifyEmailMutation = () => {
  const { verifyEmail } = useAuthStore();
  return useMutation({
    mutationFn: async (code: string) => await verifyEmail(code),
    mutationKey: [],
    onError: () => {
      toast.error("Verification process went wrong");
    },
    onSuccess: () => {
      toast.success("Account verified successfully!");
    },
  });
};

export const useAcceptBusinessRegistrationMutation = () => {
  const { acceptBusinessRegistration } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await acceptBusinessRegistration(id),
    mutationKey: [],
    onError: () => {
      toast.error("Could not accept business registration");
    },
    onSuccess: () => {
      toast.success("Business registration accepted successfully!");
      queryClient.invalidateQueries({ queryKey: ["businessRegistrations"] });
    },
  });
};

export const useRejectBusinessRegistrationMutation = () => {
  const { rejectBusinessRegistration } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => await rejectBusinessRegistration(id),
    mutationKey: [],
    onError: () => {
      toast.error("Could not reject business registration");
    },
    onSuccess: () => {
      toast.success("Business registration rejected successfully!");
      queryClient.invalidateQueries({ queryKey: ["businessRegistrations"] });
    },
  });
};
