// Moved to packages/shared/src/mutations/messagePageCache.ts as part of the
// groups domain extraction (Phase 0 of the monorepo + shared package
// feature — see context/features/mobile-foundation-reset.md), so the shared
// `createGroupMutations` factory can use it too. This file is a re-export
// shim so the existing `@/features/chat/utils/messagePageCache` import
// (still used by the not-yet-migrated conversations domain) keeps working
// unchanged; it will be deleted once conversations is repointed directly at
// "@universe/shared" (Goal 6).
export * from "@universe/shared/mutations";
