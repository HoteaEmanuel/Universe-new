import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { MdEmail } from "react-icons/md";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import AuthCard from "./components/AuthCard";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import ErrorBanner from "../components/ErrorBanner";
import SubmitButton from "../components/SubmitButton";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginFormValues } from "./schemas";

const LoginPage = () => {
  useEffect(() => {
    document.title = "Login";
  }, []);
  const url = useLocation();
  const { logIn, error, isLoading, isVerified, clearError, isAuthenticated } =
    useAuthStore();
  const navigate = useNavigate();
  useEffect(() => {
    clearError();
    return () => clearError();
  }, [clearError]);
  useEffect(() => {
    if (isAuthenticated && !error) navigate("/home");
  }, [error, navigate, isAuthenticated]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (data: LoginFormValues) => {
    await logIn(data.email, data.password);
    if (error === "Rate limit exceeded") toast.error("Too many requests");
  };
  const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
    google_auth_failed:
      "Google authentication failed. Provide a university email or try again.",
    invalid_domain:
      "Google authentication failed. Provide a university email or try again.",
    email_not_verified: "Please verify your email before continuing.",
    account_blocked:
      "Your account has been blocked. Check your email for more details.",
  };
  const [googleError, setGoogleError] = useState<string | null>(null);
  useEffect(() => {
    const errorCode = new URLSearchParams(url.search).get("error");
    if (errorCode) {
      setGoogleError(GOOGLE_ERROR_MESSAGES[errorCode] ?? GOOGLE_ERROR_MESSAGES.google_auth_failed);
    }
  }, [url.search]);
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <AuthCard title="Welcome back" variant="login">
      <form
        onSubmit={handleSubmit(onSubmit)}
        method="POST"
        className="flex w-full flex-col gap-4"
      >
        <ErrorBanner>{error}</ErrorBanner>
        <ErrorBanner>{googleError}</ErrorBanner>

        <FormField
          id="email"
          label="Email"
          icon={MdEmail}
          placeholder="University Email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <SubmitButton isLoading={isLoading} loadingText="Logging in...">
          Log in
        </SubmitButton>

        <div className="flex items-center gap-3 opacity-70">
          <hr className="flex-1 border-border" />
          <span className="text-sm">Or</span>
          <hr className="flex-1 border-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          className="h-10 w-full"
        >
          <FcGoogle className="size-5" /> Continue with Google
        </Button>

        <div className="flex items-center justify-between text-xs opacity-80">
          <Link
            to={"/forgot-password"}
            className="cursor-pointer hover:font-semibold hover:underline"
          >
            Forgot your password?
          </Link>
          {!isVerified && (
            <Link
              to="/resend-verify-email"
              className="cursor-pointer hover:font-semibold hover:underline"
            >
              Verify account
            </Link>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs">
          <p>Don't have an account?</p>
          <Link
            to={"/signup"}
            className="font-semibold text-primary hover:underline"
          >
            Create one!
          </Link>
        </div>
      </form>
    </AuthCard>
  );
};

export default LoginPage;
