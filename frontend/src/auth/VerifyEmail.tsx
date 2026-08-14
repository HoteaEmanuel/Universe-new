import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useVerifyEmailMutation } from "../queryAndMutation/mutations/auth-mutation";
import { useState, type FormEvent } from "react";
import AuthCard from "./components/AuthCard";
import ErrorBanner from "../components/ErrorBanner";
import SubmitButton from "../components/SubmitButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { isLoading, error } = useAuthStore();
  const [code, setCode] = useState("");
  // useVerifyEmailMutation lives in a plain .js file, so its inferred
  // mutation-variable type defaults to `void` — cast to the shape it
  // actually accepts at runtime (out of scope to convert that file here).
  const { mutateAsync: verifyEmail, isError } =
    useVerifyEmailMutation() as unknown as {
      mutateAsync: (code: string) => Promise<unknown>;
      isError: boolean;
    };
  const [submitError, setSubmitError] = useState<string | undefined>(
    undefined,
  );

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (code.length !== 6) {
        setSubmitError("The verification code has 6 digits");
        throw new Error("The verification code has 6 digits");
      }
      await verifyEmail(code);
      if (!isError) navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <AuthCard title="Verify your email" maxWidthClass="sm:w-2/3 max-w-lg">
      <form onSubmit={onSubmit} className="flex w-full flex-col items-center gap-4">
        <p className="text-center text-sm text-muted-foreground">
          Enter the 6-digit verification code
        </p>
        <ErrorBanner>{submitError}</ErrorBanner>
        <ErrorBanner>{error}</ErrorBanner>

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
