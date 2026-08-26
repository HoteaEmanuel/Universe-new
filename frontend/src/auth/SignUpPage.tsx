import { useEffect, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore.js";
import { MdEmail } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import AuthCard from "./components/AuthCard";
import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import ErrorBanner from "../components/ErrorBanner";
import SubmitButton from "../components/SubmitButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { normalSignupSchema, businessSignupSchema } from "./schemas";
import { parseNameFromEmail } from "./parseNameFromEmail";

type AccountType = "normal" | "business";

// Superset of both the normal- and business-account schemas so a single
// form/resolver pair can serve both, switching validation schema by
// accountType while keeping register()/errors typed against one shape.
type SignupFormValues = {
  email: string;
  password: string;
  "confirm-password": string;
  "first-name": string;
  "last-name": string;
  name: string;
  agreeToTerms: boolean;
};

const SignUpPage = () => {
  useEffect(() => {
    document.title = "Sign Up";
  }, []);

  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<AccountType>("normal");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(
      accountType === "normal" ? normalSignupSchema : businessSignupSchema,
    ) as unknown as Resolver<SignupFormValues>,
    defaultValues: { agreeToTerms: false },
  });
  const { signUp, isLoading, error } = useAuthStore();

  const emailValue = watch("email");
  const domain = emailValue?.split("@")[1]?.toLowerCase();
  const parsedName =
    accountType === "normal" && domain && domain !== "gmail.com"
      ? parseNameFromEmail(emailValue.split("@")[0])
      : null;

  useEffect(() => {
    if (parsedName) {
      setValue("first-name", parsedName.firstName);
      setValue("last-name", parsedName.lastName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedName?.firstName, parsedName?.lastName]);
  const onSubmit = async (data: SignupFormValues) => {
    const formData = {
      firstName: data["first-name"] || "",
      lastName: data["last-name"] || "",
      name: data.name || "",
      major: "",
      email: data.email,
      password: data.password,
      accountType,
    };
    try {
      await signUp(formData);
      navigate("/verify-email", { state: { email: data.email } });
    } catch (error) {
      console.log(error);
    }
  };
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000/api"}/auth/google`;
  };

  return (
    <AuthCard title="Sign Up" variant="signup">
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
          registration={register("email")}
        />

        {accountType === "normal" ? (
          <div className="flex flex-col gap-1">
            <FormField
              id="first-name"
              label="First Name"
              icon={FaUser}
              placeholder="First Name"
              autoComplete="given-name"
              error={errors["first-name"]?.message}
              registration={register("first-name")}
              disabled={!!parsedName}
            />
            {parsedName && (
              <p className="text-xs text-muted-foreground">
                Detected from your university email and can't be edited.
              </p>
            )}
          </div>
        ) : (
          <FormField
            id="name"
            label="University or Organization Name"
            icon={FaUser}
            placeholder="University or Organization Name"
            autoComplete="organization"
            error={errors.name?.message}
            registration={register("name")}
          />
        )}

        {accountType === "normal" && (
          <FormField
            id="last-name"
            label="Last Name"
            icon={FaUser}
            placeholder="Last Name"
            autoComplete="family-name"
            error={errors["last-name"]?.message}
            registration={register("last-name")}
            disabled={!!parsedName}
          />
        )}

        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          error={errors.password?.message}
          registration={register("password")}
        />

        <PasswordField
          id="confirm-password"
          label="Confirm Password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          error={errors["confirm-password"]?.message}
          registration={register("confirm-password")}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2">
            <Controller
              name="agreeToTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="agree-to-terms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-invalid={!!errors.agreeToTerms}
                  className="mt-0.5"
                />
              )}
            />
            <Label htmlFor="agree-to-terms" className="text-xs font-normal">
              I agree to the{" "}
              <Link
                to="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link
                to="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Terms of Service
              </Link>
            </Label>
          </div>
          {errors.agreeToTerms && (
            <p className="error">{errors.agreeToTerms.message}</p>
          )}
        </div>

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
