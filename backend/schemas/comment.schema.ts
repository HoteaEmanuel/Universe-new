import { z } from "zod";

export const sendCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment should have less than 1000 characters"),
  parentId: z.string().uuid("parentId must be a valid id").optional(),
});
export type SendCommentInput = z.infer<typeof sendCommentSchema>;

export const commentQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;

export const replyParamsSchema = z.object({
  id: z.string().uuid("post id must be a valid id"),
  commentId: z.string().uuid("comment id must be a valid id"),
});
export type ReplyParamsInput = z.infer<typeof replyParamsSchema>;
