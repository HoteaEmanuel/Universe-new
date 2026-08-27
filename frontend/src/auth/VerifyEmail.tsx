import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useVerifyEmailMutation } from "../queryAndMutation/mutations/auth-mutation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import AuthCard from "./components/AuthCard";
import ErrorBanner from "../components/ErrorBanner";
import SubmitButton from "../components/SubmitButton";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useAuthStore();
  const [email, setEmail] = useState(
    (location.state as { email?: string } | null)?.email ?? "",
  );
  const [code, setCode] = useState("");
  const { mutateAsync: verifyEmail, isError } = useVerifyEmailMutation();
  const [submitError, setSubmitError] = useState<string | undefined>(
    undefined,
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (!email) {
        setSubmitError("Enter the email you signed up with");
        throw new Error("Enter the email you signed up with");
      }
      if (code.length !== 6) {
        setSubmitError("The verification code has 6 digits");
        throw new Error("The verification code has 6 digits");
      }
      await verifyEmail({ email, code });
      if (!isError) navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthCard title="Verify your email" maxWidthClass="sm:w-2/3 max-w-lg">
      <form onSubmit={onSubmit} className="flex w-full flex-col items-center gap-4">
        <p className="list-loading-text">
          Enter the 6-digit verification code
        </p>
        <ErrorBanner>{submitError}</ErrorBanner>
        <ErrorBanner>{error}</ErrorBanner>

        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          className="h-10"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />

        <InputOTP
          maxLength={6}
          value={code}
          onChange={setCode}
          className=""
          containerClassName=""
        >
          <InputOTPGroup className="">
            {Array.from({ length: 6 }).map((_, index) => (
              <InputOTPSlot key={index} index={index} className="size-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <SubmitButton isLoading={isLoading} loadingText="Verifying...">
          Verify Email
        </SubmitButton>
      </form>
    </AuthCard>
  );
};

export default VerifyEmail;
