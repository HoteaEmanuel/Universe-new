import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "../../store/authStore";

export const useChangePasswordMutation = () => {
  const { changePassword } = useAuthStore();
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
  });
};

export const useDeleteAccountMutation = () => {
  const { deleteAccount } = useAuthStore();
  return useMutation({
    mutationFn: (password?: string) => deleteAccount(password),
  });
};
