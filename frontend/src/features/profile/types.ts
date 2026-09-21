// Moved to packages/shared/src (Phase 0 of the monorepo + shared package
// feature — see context/features/mobile-foundation-reset.md). This file is
// a re-export shim so every existing `@/features/profile/types` import in
// this codebase keeps working unchanged; it will be deleted once those
// call sites are repointed directly at "@universe/shared" (Goal 6).
export * from "@universe/shared";
