import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";
import { AxiosError } from "axios";
import { toast } from "sonner";

export const useSignUpMutation = (firstName, lastName, email, password) => {
  // const queryClient = useQueryClient();
  const { signUp } = useAuthStore();
  return useMutation({
    mutationFn: () => signUp(firstName, lastName, email, password),
    mutationKey: [],
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error();
      }
    },
  });
};
export const useVerifyEmailMutation = () => {
  // const queryClient = useQueryClient();
  const { verifyEmail } = useAuthStore();
  return useMutation({
    mutationFn: async ({ email, code }) => await verifyEmail(email, code),
    mutationKey: [],
    onError: () => {
      toast.error("Verification process went wrong");
    },
    onSuccess: () => {
      toast.success("Account verified successfully!");
      console.log("ACCOUNT VERIFIED");
    },
  });
};
export const useAcceptBusinessRegistrationMutation = () => {
  const { acceptBusinessRegistration } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => await acceptBusinessRegistration(id),
    mutationKey: [],
    onError: () => {
      toast.error("Could not accept business registration");
    },
    onSuccess: () => {
      toast.success("Business registration accepted successfully!");
      queryClient.invalidateQueries(["businessRegistrations"]);
    },
    query: ["businessRegistrations"],
  });
};
export const useRejectBusinessRegistrationMutation = () => {
  const { rejectBusinessRegistration } = useAuthStore();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => await rejectBusinessRegistration(id),
    mutationKey: [],
    onError: () => {
      toast.error("Could not reject business registration");
    },
    onSuccess: () => {
      toast.success("Business registration rejected successfully!");
      queryClient.invalidateQueries(["businessRegistrations"]);
    },
  });
};
