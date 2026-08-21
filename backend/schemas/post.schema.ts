import { z } from "zod";
import { pollQuestionSchema, pollOptionTextSchema } from "./poll.schema.js";

const title = z
  .string()
  .min(2, "Title should have at least 2 characters")
  .max(100, "Title should have less than 100 characters");

const body = z
  .string()
  .min(5, "Body should have at least 5 characters")
  .max(2200, "Body should have less than 2200 characters");

const location = z
  .string()
  .max(100, "Location should have less than 100 characters")
  .optional();

const tags = z.string().max(100, "Tags should have less than 100 characters");

// Multipart form-data has no native array type - repeated "pollOptions" form
// fields arrive as either a single string or an array, same shape as
// updatePostSchema's "images" field below.
const pollOptions = z
  .union([pollOptionTextSchema, z.array(pollOptionTextSchema)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

export const createPostSchema = z
  .object({
    title,
    body: body.optional(),
    location,
    tags: tags.min(1, "Add a tag"),
    pollQuestion: pollQuestionSchema.optional(),
    pollOptions: pollOptions.optional(),
    pollClosesAt: z.coerce.date().optional(),
  })
  .refine((data) => !data.pollOptions || !!data.pollQuestion, {
    message: "A poll needs a question",
    path: ["pollQuestion"],
  })
  .refine((data) => !data.pollOptions || data.pollOptions.length >= 2, {
    message: "A poll needs at least 2 options",
    path: ["pollOptions"],
  })
  .refine((data) => !data.pollOptions || data.pollOptions.length <= 6, {
    message: "A poll can have at most 6 options",
    path: ["pollOptions"],
  });
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  body: body.optional(),
  location,
  tags: tags.optional(),
  // Existing image URLs to retain, sent alongside new files under the same
  // "images" form field — multer routes the string entries into req.body.
  images: z.union([z.string(), z.array(z.string())]).optional(),
});
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const postIdSchema = z.object({
  postId: z
    .string()
    .min(1, "postId is required")
    .uuid("postId must be a valid id"),
});
export type PostIdInput = z.infer<typeof postIdSchema>;

export const deletePostsByNameSchema = z.object({
  title: z.string().min(1, "title is required"),
});
export type DeletePostsByNameInput = z.infer<typeof deletePostsByNameSchema>;

export const feedQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

export const usersWhoLikedQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type UsersWhoLikedQueryInput = z.infer<typeof usersWhoLikedQuerySchema>;

export const sharePostSchema = z
  .object({
    recipientIds: z.array(z.string().uuid("recipientIds must be valid ids")).default([]),
    groupIds: z.array(z.string().uuid("groupIds must be valid ids")).default([]),
  })
  .refine((data) => data.recipientIds.length + data.groupIds.length > 0, {
    message: "Select at least one recipient",
    path: ["recipientIds"],
  })
  .refine((data) => data.recipientIds.length + data.groupIds.length <= 20, {
    message: "You can share with at most 20 people or groups at once",
    path: ["recipientIds"],
  });
export type SharePostInput = z.infer<typeof sharePostSchema>;
