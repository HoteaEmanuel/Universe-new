import { z } from "zod";

const email = z
  .string()
  .min(1, "Email is required")
  .email("Email must be a valid email address");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters long");

const normalSignupSchema = z.object({
  accountType: z.literal("normal"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email,
  password,
  major: z.string().optional(),
});

const businessSignupSchema = z.object({
  accountType: z.literal("business"),
  name: z.string().min(1, "Organization name is required"),
  email,
  password,
});

export const signupSchema = z.discriminatedUnion("accountType", [
  normalSignupSchema,
  businessSignupSchema,
]);
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  verificationCode: z.string().min(1, "Verification code is required"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendVerifyEmailSchema = z.object({
  email,
});
export type ResendVerifyEmailInput = z.infer<typeof resendVerifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  email,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const googleMobileSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
});
export type GoogleMobileInput = z.infer<typeof googleMobileSchema>;
