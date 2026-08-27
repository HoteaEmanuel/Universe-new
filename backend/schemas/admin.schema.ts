import { z } from "zod";

export const blockUserSchema = z.object({
  reason: z.string().max(500, "Reason should have less than 500 characters").optional(),
});

export const listUsersQuerySchema = z.object({
  search: z.string().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
