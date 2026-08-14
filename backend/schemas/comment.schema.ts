import { z } from "zod";

export const sendCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment should have less than 1000 characters"),
});
export type SendCommentInput = z.infer<typeof sendCommentSchema>;

export const commentQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
