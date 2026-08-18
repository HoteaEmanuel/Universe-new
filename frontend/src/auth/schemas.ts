import { z } from "zod";

const email = z
  .string()
  .min(1, "An university email is required")
  .email("Email must be a valid email address");

const password = z
  .string()
  .min(8, "The password needs to be at least 8 characters long");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "The password is required"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

const signupShared = {
  email,
  password,
  "confirm-password": z.string().min(1, "Please confirm your password"),
};

export const normalSignupSchema = z
  .object({
    // Optional here: for university emails that follow the
    // firstname.lastname convention, the backend derives these from the
    // verified email instead. Only enforced server-side when it can't.
    "first-name": z.string().optional(),
    "last-name": z.string().optional(),
    ...signupShared,
  })
  .refine((data) => data.password === data["confirm-password"], {
    message: "Passwords do not match",
    path: ["confirm-password"],
  });
export type NormalSignupFormValues = z.infer<typeof normalSignupSchema>;

export const businessSignupSchema = z
  .object({
    name: z.string().min(1, "Enter your university or organization name"),
    ...signupShared,
  })
  .refine((data) => data.password === data["confirm-password"], {
    message: "Passwords do not match",
    path: ["confirm-password"],
  });
export type BusinessSignupFormValues = z.infer<typeof businessSignupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Enter a minimum 8 characters password"),
});
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});
export type ResendVerificationFormValues = z.infer<typeof resendVerificationSchema>;
