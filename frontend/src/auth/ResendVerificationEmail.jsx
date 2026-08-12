import React from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../store/authStore";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MdEmail } from "react-icons/md";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import ErrorBanner from "../components/ErrorBanner";
import SubmitButton from "../components/SubmitButton";

const ResendVerificationEmail = () => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { sendVerificationEmail, isLoading, error } = useAuthStore();

  const onSubmit = async (data) => {
    try {
      await sendVerificationEmail(data.email);
      toast.success("Verification email sent! Check your inbox.", {
        duration: 5000,
      });
      navigate("/verify-email");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthCard title="Verify your account">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4"
      >
        <p className="-mt-2 text-center text-sm text-muted-foreground">
          We'll send a new verification code to your inbox.
        </p>

        <ErrorBanner>{error}</ErrorBanner>

        <FormField
          id="email"
          label="Email"
          icon={MdEmail}
          placeholder="Email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email", {
            required: "Email is required",
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: "Enter a valid email address",
            },
          })}
        />

        <SubmitButton isLoading={isLoading} loadingText="Sending...">
          Send Verification Email
        </SubmitButton>

        <p className="text-center text-xs">
          {error === "This user is already verified"
            ? "Already verified?"
            : "Remembered your password?"}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default ResendVerificationEmail;
