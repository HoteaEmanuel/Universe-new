import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PasswordField from "@/components/PasswordField";
import SubmitButton from "@/components/SubmitButton";
import { useChangePasswordMutation } from "@/queryAndMutation/mutations/account-mutation";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Enter a minimum 8 characters password"),
    confirmNewPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const ChangePasswordForm = () => {
  const { mutateAsync: changePassword, isPending } = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormValues) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
    } catch (error) {
      const response = error as { response?: { data?: { message?: string } } };
      setError("currentPassword", {
        message: response.response?.data?.message ?? "Could not change password",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4">
      <PasswordField
        id="current-password"
        label="Current password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        registration={register("currentPassword")}
      />
      <PasswordField
        id="new-password"
        label="New password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        registration={register("newPassword")}
      />
      <PasswordField
        id="confirm-new-password"
        label="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        registration={register("confirmNewPassword")}
      />
      <SubmitButton isLoading={isPending} loadingText="Changing password...">
        Change password
      </SubmitButton>
    </form>
  );
};

export default ChangePasswordForm;
