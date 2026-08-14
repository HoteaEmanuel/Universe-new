import { z } from "zod";

export const sendCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment should have less than 1000 characters"),
});
export type SendCommentInput = z.infer<typeof sendCommentSchema>;
