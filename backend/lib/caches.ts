import { MemoryCache } from "./memoryCache.js";

export const feedCache = new MemoryCache();
export const profileCache = new MemoryCache();
// Matches the TTL blockCache.ts was already using before its Redis path got
// disabled - kept as-is rather than switched to the 3min default.
export const blockedIdsCache = new MemoryCache(5 * 60 * 1000);
