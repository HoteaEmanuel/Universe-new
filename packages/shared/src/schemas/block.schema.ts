import { z } from "zod";

export const blockUserSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});
export type BlockUserInput = z.infer<typeof blockUserSchema>;
