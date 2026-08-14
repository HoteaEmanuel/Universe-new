import { z } from "zod";

export const generateHashtagsSchema = z.object({
  postContent: z.string().min(1, "Post content is mandatory"),
});
export type GenerateHashtagsInput = z.infer<typeof generateHashtagsSchema>;
