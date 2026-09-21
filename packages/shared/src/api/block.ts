import type { BlockedUser } from "../chat.js";
import type { HttpClient } from "./client.js";

export const createBlockApi = (client: HttpClient) => ({
  listBlockedUsers: async () =>
    (await client.get<{ blockedUsers: BlockedUser[] }>("/blocks")).blockedUsers,

  block: (userId: string) => client.post<unknown>("/blocks/block", { userId }),

  unblock: (userId: string) => client.post<unknown>("/blocks/unblock", { userId }),
});
