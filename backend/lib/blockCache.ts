import { findBlockedUserIdsEitherDirection } from "../repository/block.repository.js";
import { blockedIdsCache } from "./caches.js";

const blockedIdsCacheKey = (userId: string) => `blocked-ids-${userId}`;

// Per-viewer set of user ids blocked in either direction (blocked-by-viewer
// or blocking-viewer), used to filter feed/comments/search/etc. in the app
// layer instead of joining Block into every content query. Read on every
// authenticated request (see middleware/loadBlockedIds.ts), so this being
// cached instead of a fresh query each time matters a lot under load.
export const getBidirectionalBlockedIds = async (
  userId: string,
): Promise<Set<string>> => {
  const ids = await blockedIdsCache.getOrSet(blockedIdsCacheKey(userId), () =>
    findBlockedUserIdsEitherDirection(userId),
  );
  return new Set(ids);
};

// Call after a block/unblock so both participants' cached sets don't serve
// stale data for the remainder of the cache's TTL.
export const invalidateBidirectionalBlockedIds = async (
  userIdA: string,
  userIdB: string,
) => {
  blockedIdsCache.invalidate(blockedIdsCacheKey(userIdA));
  blockedIdsCache.invalidate(blockedIdsCacheKey(userIdB));
};
