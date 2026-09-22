import type { HttpClient } from "./client.js";

export const createAiApi = (client: HttpClient) => ({
  suggestHashtags: async (postContent: string) =>
    (await client.post<{ hashtags: string[] }>("/ai/hashtags", { postContent })).hashtags,
});
