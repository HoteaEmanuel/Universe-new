import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name should have less than 50 characters"),
  description: z
    .string()
    .max(300, "Description should have less than 300 characters")
    .optional(),
  visibility: z.enum(["public", "private"]).optional(),
  courseTag: z.string().min(1).max(100).optional(),
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const setGroupCourseTagSchema = z.object({
  courseTag: z.string().min(1).max(100).nullable().optional(),
});
export type SetGroupCourseTagInput = z.infer<typeof setGroupCourseTagSchema>;

export const discoverGroupsQuerySchema = z.object({
  courseTag: z.string().min(1).max(100).optional(),
  universityOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(20).optional(),
});
export type DiscoverGroupsQueryInput = z.infer<typeof discoverGroupsQuerySchema>;

export const addMemberToGroupSchema = z.object({
  userId: z
    .string()
    .min(1, "userId is required")
    .uuid("userId must be a valid id"),
});
export type AddMemberToGroupInput = z.infer<typeof addMemberToGroupSchema>;

export const sendGroupMessageSchema = z.object({
  messageText: z
    .string()
    .max(2000, "Message should have less than 2000 characters")
    .optional(),
});
export type SendGroupMessageInput = z.infer<typeof sendGroupMessageSchema>;

export const sendGroupVoiceMessageSchema = z.object({
  durationSec: z.coerce.number().int().min(1).max(120),
});
export type SendGroupVoiceMessageInput = z.infer<typeof sendGroupVoiceMessageSchema>;

export const editGroupMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message should have less than 2000 characters"),
});
export type EditGroupMessageInput = z.infer<typeof editGroupMessageSchema>;

export const groupMessagesQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type GroupMessagesQueryInput = z.infer<typeof groupMessagesQuerySchema>;

export const groupsListQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  search: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type GroupsListQueryInput = z.infer<typeof groupsListQuerySchema>;

export const groupMentionSearchQuerySchema = z.object({
  q: z.string().trim().toLowerCase().max(30),
});

export const groupMediaQuerySchema = z.object({
  type: z.enum(["images", "files"]).default("images"),
  before: z.string().min(1).optional(),
});
export type GroupMediaQueryInput = z.infer<typeof groupMediaQuerySchema>;

export const reactToGroupMessageSchema = z.object({
  emoji: z.string().min(1, "emoji is required").max(32, "Invalid emoji"),
});
export type ReactToGroupMessageInput = z.infer<typeof reactToGroupMessageSchema>;

export const banGroupMemberSchema = z.object({
  reason: z.string().max(500, "Reason should have less than 500 characters").optional(),
});
export type BanGroupMemberInput = z.infer<typeof banGroupMemberSchema>;

export const groupBansQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
export type GroupBansQueryInput = z.infer<typeof groupBansQuerySchema>;
