import { z } from "zod";

export const updateBioSchema = z.object({
  bio: z.string().max(150, "Bio should have less than 150 characters"),
});
export type UpdateBioInput = z.infer<typeof updateBioSchema>;

const usernamePattern = /^[a-z0-9_]{3,30}$/;
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(usernamePattern, "Username must be 3–30 lowercase letters, numbers, or underscores");

export const updateUsernameSchema = z.object({ username: usernameSchema });
export type UpdateUsernameInput = z.infer<typeof updateUsernameSchema>;

export const usernameAvailabilityQuerySchema = z.object({
  username: z.string().trim().toLowerCase(),
});

export const mentionSearchQuerySchema = z.object({
  q: z.string().trim().toLowerCase().max(30),
});

export const followSchema = z.object({
  followerId: z
    .string()
    .min(1, "followerId is required")
    .uuid("followerId must be a valid id"),
});
export type FollowInput = z.infer<typeof followSchema>;

export const unfollowSchema = z.object({
  unfollowId: z
    .string()
    .min(1, "unfollowId is required")
    .uuid("unfollowId must be a valid id"),
});
export type UnfollowInput = z.infer<typeof unfollowSchema>;

export const followListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
});
export type FollowListQueryInput = z.infer<typeof followListQuerySchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long"),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().optional(),
});
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
