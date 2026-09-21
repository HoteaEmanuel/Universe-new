import type { Preferences, UpdatePreferencesPayload } from "../preferences.js";
import type { HttpClient } from "./client.js";

export const createPreferencesApi = (client: HttpClient) => ({
  get: async () => (await client.get<{ preferences: Preferences }>("/preferences")).preferences,

  update: async (data: UpdatePreferencesPayload) =>
    (await client.patch<{ preferences: Preferences }>("/preferences", data)).preferences,
});
