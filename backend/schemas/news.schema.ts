import { z } from "zod";

export const newsCategoryParamSchema = z.object({
  category: z.string().min(1, "category is required"),
});
export type NewsCategoryParamInput = z.infer<typeof newsCategoryParamSchema>;
