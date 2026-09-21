import { z } from "zod";

// Shared by every notifications route's :id param. Note it isn't always a
// userId — seeNewConversationMessages reads it as a conversationId — so this
// only validates the param is UUID-shaped, not what it conceptually is.
export const idParamSchema = z.object({
  id: z.string().min(1, "id is required").uuid("id must be a valid id"),
});
export type IdParamInput = z.infer<typeof idParamSchema>;

export const notificationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
