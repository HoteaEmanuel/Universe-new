import { z } from "zod";

export const RESOURCE_CATEGORIES = [
  "lecture_notes",
  "assignment",
  "exam_prep",
  "link",
  "recording",
  "other",
] as const;

const resourceLink = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || /^https?:\/\//i.test(value), {
    message: "Link must start with http:// or https://",
  });

export const createGroupResourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title should have less than 150 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description should have less than 1000 characters")
    .optional(),
  category: z.enum(RESOURCE_CATEGORIES),
  week: z.string().trim().max(50).optional(),
  linkUrl: resourceLink.optional(),
});
export type CreateGroupResourceInput = z.infer<
  typeof createGroupResourceSchema
>;

export const updateGroupResourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(150, "Title should have less than 150 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description should have less than 1000 characters")
    .optional(),
  category: z.enum(RESOURCE_CATEGORIES).optional(),
  week: z.string().trim().max(50).optional(),
});
export type UpdateGroupResourceInput = z.infer<
  typeof updateGroupResourceSchema
>;

export const groupResourcesQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  category: z.enum(RESOURCE_CATEGORIES).optional(),
  search: z.string().max(200).optional(),
  week: z.string().max(50).optional(),
});
export type GroupResourcesQueryInput = z.infer<
  typeof groupResourcesQuerySchema
>;
