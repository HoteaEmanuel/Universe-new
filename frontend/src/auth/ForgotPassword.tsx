import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import { MdEmail } from "react-icons/md";
import AuthCard from "../components/AuthCard";
import FormField from "../components/FormField";
import SubmitButton from "../components/SubmitButton";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "./schemas";

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useAuthStore();
  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      await forgotPassword(data.email);
      toast.success("Password reset email sent! Check your inbox.", {
        duration: 5000,
      });
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <AuthCard title="Reset your password">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full flex-col gap-4"
      >
        <FormField
          id="email"
          label="Enter your email"
          icon={MdEmail}
          placeholder="Email"
          autoComplete="email"
          error={errors.email?.message}
          registration={register("email")}
        />
        <SubmitButton isLoading={isLoading} loadingText="Sending...">
          Change password!
        </SubmitButton>
      </form>
    </AuthCard>
  );
};

export default ForgotPassword;
