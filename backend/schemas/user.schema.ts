import { z } from "zod";

export const updateBioSchema = z.object({
  bio: z.string().max(150, "Bio should have less than 150 characters"),
});
export type UpdateBioInput = z.infer<typeof updateBioSchema>;

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
