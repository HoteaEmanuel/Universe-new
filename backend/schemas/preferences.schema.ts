import { z } from "zod";

export const updatePreferencesSchema = z
  .object({
    theme: z.enum(["light", "dark"]).optional(),
    notificationsEnabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one preference field is required",
  });
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
