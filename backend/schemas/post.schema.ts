import { z } from "zod";

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

export const createPostSchema = z.object({
  title,
  body,
  location,
  tags: tags.min(1, "Add a tag"),
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
