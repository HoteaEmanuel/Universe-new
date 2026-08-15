import { z } from "zod";

export const startConversationSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message should have less than 2000 characters"),
});
export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  messageText: z
    .string()
    .max(2000, "Message should have less than 2000 characters")
    .optional(),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const sendVoiceMessageSchema = z.object({
  durationSec: z.coerce.number().int().min(1).max(120),
});
export type SendVoiceMessageInput = z.infer<typeof sendVoiceMessageSchema>;

export const editMessageSchema = z.object({
  newContent: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message should have less than 2000 characters"),
});
export type EditMessageInput = z.infer<typeof editMessageSchema>;

export const messagesQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
export type MessagesQueryInput = z.infer<typeof messagesQuerySchema>;

export const mediaQuerySchema = z.object({
  before: z.string().min(1).optional(),
});
export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;

export const reactToMessageSchema = z.object({
  emoji: z.string().min(1, "emoji is required").max(32, "Invalid emoji"),
});
export type ReactToMessageInput = z.infer<typeof reactToMessageSchema>;
