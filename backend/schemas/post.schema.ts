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

const postType = z.enum(["standard", "opportunity"]);
const opportunityType = z.enum([
  "internship",
  "part_time",
  "full_time",
  "graduate_program",
  "volunteering",
  "campus_ambassador",
]);
const workplaceType = z.enum(["onsite", "hybrid", "remote"]);
const httpsUrl = z.string().url("Enter a valid application link").refine(
  (value) => new URL(value).protocol === "https:",
  "Application links must use HTTPS",
);

const opportunityFields = {
  type: postType.optional(),
  opportunityType: opportunityType.optional(),
  workplaceType: workplaceType.optional(),
  companyName: z.string().trim().min(2).max(120).optional(),
  applyUrl: httpsUrl.optional(),
  deadlineAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
};

const validateOpportunityFields = (
  data: {
    type?: z.infer<typeof postType>;
    opportunityType?: z.infer<typeof opportunityType>;
    workplaceType?: z.infer<typeof workplaceType>;
    companyName?: string;
    applyUrl?: string;
    deadlineAt?: Date;
    expiresAt?: Date;
  },
  ctx: z.RefinementCtx,
) => {
  const opportunityKeys = [
    "opportunityType",
    "workplaceType",
    "companyName",
    "applyUrl",
    "deadlineAt",
    "expiresAt",
  ] as const;
  if (data.type !== "opportunity") {
    for (const key of opportunityKeys) {
      if (data[key] !== undefined) {
        ctx.addIssue({ code: "custom", path: [key], message: "This field is only available for opportunity posts" });
      }
    }
    return;
  }
  if (!data.opportunityType) ctx.addIssue({ code: "custom", path: ["opportunityType"], message: "Choose an opportunity type" });
  if (!data.workplaceType) ctx.addIssue({ code: "custom", path: ["workplaceType"], message: "Choose a workplace type" });
  if (!data.companyName) ctx.addIssue({ code: "custom", path: ["companyName"], message: "Enter the company name" });
  if (!data.applyUrl) ctx.addIssue({ code: "custom", path: ["applyUrl"], message: "Add an external application link" });
  if (data.deadlineAt && data.expiresAt && data.expiresAt < data.deadlineAt) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiration cannot be before the application deadline" });
  }
};

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
    ...opportunityFields,
    type: postType.default("standard"),
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
  })
  .superRefine(validateOpportunityFields);
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object({
  title: title.optional(),
  body: body.optional(),
  location,
  tags: tags.optional(),
  ...opportunityFields,
  // Existing image URLs to retain, sent alongside new files under the same
  // "images" form field — multer routes the string entries into req.body.
  images: z.union([z.string(), z.array(z.string())]).optional(),
}).superRefine(validateOpportunityFields);
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

export const opportunitiesQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(100).default(""),
  opportunityType: opportunityType.optional(),
  workplaceType: workplaceType.optional(),
  location: z.string().trim().max(100).optional(),
  status: z.enum(["active", "expired", "all"]).default("active"),
  sort: z.enum(["newest", "deadline"]).default("newest"),
  savedOnly: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
});
export type OpportunitiesQueryInput = z.infer<typeof opportunitiesQuerySchema>;

export const opportunityStatusSchema = z.object({ closed: z.boolean() });
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
