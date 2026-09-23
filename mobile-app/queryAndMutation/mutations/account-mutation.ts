import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../../store/authStore";

export const useChangePasswordMutation = () => {
  const { changePassword } = useAuthStore();
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword?: string;
      newPassword: string;
    }) => changePassword(newPassword, currentPassword),
  });
};

export const useDeleteAccountMutation = () => {
  const { deleteAccount } = useAuthStore();
  return useMutation({
    mutationFn: (password?: string) => deleteAccount(password),
  });
};
