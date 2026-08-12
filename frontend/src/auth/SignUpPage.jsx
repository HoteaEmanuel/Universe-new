import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { MdEmail } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import ErrorBanner from "../components/ErrorBanner";
import SubmitButton from "../components/SubmitButton";
import { Button } from "@/components/ui/button";

const SignUpPage = () => {
  useEffect(() => {
    document.title = "Sign Up";
  }, []);

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [accountType, setAccountType] = useState("normal");
  const { signUp, isLoading, error } = useAuthStore();
  const onSubmit = async (data) => {
    const formData = {
      firstName: data["first-name"] || "",
      lastName: data["last-name"] || "",
      name: data["name"] || "",
      major: data["major"] || "",
      email: data.email,
      password: data.password,
      accountType: accountType,
    };
    try {
      await signUp(formData);
      navigate("/verify-email");
    } catch (error) {
      console.log(error);
    }
  };
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <AuthCard title="Sign Up" maxWidthClass="sm:w-2/3 md:w-1/3 max-w-lg">
      <form
        onSubmit={handleSubmit(onSubmit)}
        method="POST"
        className="flex w-full flex-col gap-4"
      >
        <div className="flex w-full overflow-hidden rounded-lg border border-border">
          <Button
            type="button"
            variant="ghost"
            className={`h-9 flex-1 rounded-none text-xs ${
              accountType === "normal"
                ? "bg-primary text-primary-foreground hover:bg-primary"
                : "hover:bg-muted"
            }`}
            onClick={() => setAccountType("normal")}
          >
            Normal Account
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`h-9 flex-1 rounded-none text-xs ${
              accountType === "business"
                ? "bg-primary text-primary-foreground hover:bg-primary"
                : "hover:bg-muted"
            }`}
            onClick={() => setAccountType("business")}
          >
            University Account
          </Button>
        </div>
        {accountType === "business" && (
          <p className="-mt-1 text-center text-xs text-muted-foreground">
            Official accounts are manually reviewed before they're verified.
          </p>
        )}

        <ErrorBanner>{error}</ErrorBanner>

        <FormField
          id="email"
          label="University Email Address"
          icon={MdEmail}
          placeholder="Email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email", {
            required: "An university email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email format",
            },
          })}
        />

        <FormField
          id={accountType === "normal" ? "first-name" : "name"}
          label={accountType === "normal" ? "First Name" : "Name"}
          icon={FaUser}
          placeholder={accountType === "normal" ? "First Name" : "Name"}
          autoComplete={accountType === "normal" ? "given-name" : "organization"}
          error={errors[accountType === "normal" ? "first-name" : "name"]?.message}
          registration={register(accountType === "normal" ? "first-name" : "name", {
            required:
              accountType === "normal"
                ? "Enter your first name"
                : "Enter your company name",
          })}
        />

        {accountType === "normal" && (
          <FormField
            id="last-name"
            label="Last Name"
            icon={FaUser}
            placeholder="Last Name"
            autoComplete="family-name"
            error={errors["last-name"]?.message}
            registration={register("last-name", {
              required: "Enter your last name",
            })}
          />
        )}

        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password", {
            required: "The password is required",
            validate: (value) =>
              value.length >= 8 ||
              "The password needs to be at least 8 characters long",
          })}
        />

        <PasswordField
          id="confirm-password"
          label="Confirm Password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          error={errors["confirm-password"]?.message}
          registration={register("confirm-password", {
            required: "Please confirm your password",
            validate: (value) => {
              if (value !== document.getElementById("password").value) {
                return "Passwords do not match";
              }
              return true;
            },
          })}
        />

        <SubmitButton isLoading={isLoading} loadingText="Signing up...">
          Sign Up
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

        <p className="text-center text-xs">
          Already have an account?{" "}
          <Link
            to={"/login"}
            className="font-semibold text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
};

export default SignUpPage;
