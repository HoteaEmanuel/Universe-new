import { z } from "zod";

export const reportTargetTypeEnum = z.enum(["user_profile", "post", "comment"]);

export const reportReasonEnum = z.enum([
  "spam",
  "harassment_or_bullying",
  "hate_speech",
  "nudity_or_sexual_content",
  "violence_or_dangerous_content",
  "misinformation",
  "impersonation",
  "self_harm_or_suicide",
  "intellectual_property",
  "other",
]);

export const reportStatusEnum = z.enum(["pending", "resolved", "dismissed"]);

const reportCommonFields = {
  reason: reportReasonEnum,
  details: z.string().max(500, "Details should have less than 500 characters").optional(),
  alsoBlock: z.boolean().optional(),
};

export const createReportSchema = z.discriminatedUnion("targetType", [
  z.object({
    targetType: z.literal("post"),
    postId: z.string().min(1, "postId is required"),
    ...reportCommonFields,
  }),
  z.object({
    targetType: z.literal("comment"),
    commentId: z.string().min(1, "commentId is required"),
    ...reportCommonFields,
  }),
  z.object({
    targetType: z.literal("user_profile"),
    reportedUserId: z.string().min(1, "reportedUserId is required"),
    ...reportCommonFields,
  }),
]);
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const listReportsQuerySchema = z.object({
  status: reportStatusEnum.optional(),
  reason: reportReasonEnum.optional(),
  targetType: reportTargetTypeEnum.optional(),
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListReportsQueryInput = z.infer<typeof listReportsQuerySchema>;

export const resolveReportSchema = z.object({
  action: z.enum(["dismiss", "remove_content", "block_user"]),
  note: z.string().max(500, "Note should have less than 500 characters").optional(),
});
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
