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
});
export type CreateGroupInput = z.infer<typeof createGroupSchema>;

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

export const groupMediaQuerySchema = z.object({
  before: z.string().min(1).optional(),
});
export type GroupMediaQueryInput = z.infer<typeof groupMediaQuerySchema>;
