import React from "react";
import { useAuthStore } from "../store/authStore";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import PasswordField from "../components/PasswordField";
import SubmitButton from "../components/SubmitButton";

const ResetPassword = () => {
  const { resetPassword, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { token } = useParams();
  const onSubmit = async (data) => {
    try {
      const response = await resetPassword(token, data.password);
      if (response instanceof Error) {
        throw response;
      }
      navigate("/login");
    } catch (error) {
      return new Error(error);
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
          registration={register("password", {
            required: "The password is required",
            minLength: {
              value: 8,
              message: "Enter a minimum 8 characters password",
            },
          })}
        />
        <SubmitButton isLoading={isLoading} loadingText="Resetting...">
          Reset Password
        </SubmitButton>
      </form>
    </AuthCard>
  );
};

export default ResetPassword;
