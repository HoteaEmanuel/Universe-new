import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().max(200, "Search query is too long").optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

export const searchOverviewQuerySchema = z.object({
  q: z.string().max(200, "Search query is too long").optional(),
});
export type SearchOverviewQueryInput = z.infer<typeof searchOverviewQuerySchema>;
