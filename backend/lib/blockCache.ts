import { findBlockedUserIdsEitherDirection } from "../repository/block.repository.js";
// Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
// import { redis } from "./redis.js";

const BLOCKED_IDS_CACHE_TTL_SECONDS = 300;
const blockedIdsCacheKey = (userId: string) => `blocked-ids-${userId}`;

// Per-viewer set of user ids blocked in either direction (blocked-by-viewer
// or blocking-viewer), used to filter feed/comments/search/etc. in the app
// layer instead of joining Block into every content query.
export const getBidirectionalBlockedIds = async (
  userId: string,
): Promise<Set<string>> => {
  // Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
  // try {
  //   const cached = await redis.get<string[]>(blockedIdsCacheKey(userId));
  //   if (cached) return new Set(cached);
  // } catch (cacheError) {
  //   console.warn("Redis cache read failed (non-fatal):", cacheError);
  // }

  const blockedIds = await findBlockedUserIdsEitherDirection(userId);

  // Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
  // try {
  //   await redis.setex(
  //     blockedIdsCacheKey(userId),
  //     BLOCKED_IDS_CACHE_TTL_SECONDS,
  //     JSON.stringify(blockedIds),
  //   );
  // } catch (cacheError) {
  //   console.warn("Redis cache write failed (non-fatal):", cacheError);
  // }

  return new Set(blockedIds);
};

// Call after a block/unblock so both participants' cached sets don't serve
// stale data for the remainder of the cache's TTL.
export const invalidateBidirectionalBlockedIds = async (
  userIdA: string,
  userIdB: string,
) => {
  // Redis disabled for dev (avoid burning Upstash quota) — see lib/redis.js
  // try {
  //   await redis.del(blockedIdsCacheKey(userIdA), blockedIdsCacheKey(userIdB));
  // } catch (cacheError) {
  //   console.warn("Redis cache invalidation failed (non-fatal):", cacheError);
  // }
};
