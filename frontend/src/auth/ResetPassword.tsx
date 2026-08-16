import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../store/authStore";
import { useNavigate, useParams } from "react-router-dom";
import AuthCard from "./components/AuthCard";
import PasswordField from "../components/PasswordField";
import SubmitButton from "../components/SubmitButton";
import { resetPasswordSchema, type ResetPasswordFormValues } from "./schemas";

const ResetPassword = () => {
  const { resetPassword, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });
  const { token } = useParams();
  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      await resetPassword(token ?? "", data.password);
      navigate("/login");
    } catch (error) {
      return new Error(error as string);
    }
  };
  return (
    <AuthCard title="Enter the new password">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4"
      >
        <PasswordField
          id="new-password"
          label="New password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />
        <SubmitButton isLoading={isLoading} loadingText="Resetting...">
          Reset Password
        </SubmitButton>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
