// Moved to packages/shared/src (Phase 0 of the monorepo + shared package
// feature — see context/features/mobile-foundation-reset.md). This file is
// a re-export shim so every existing `@/queryAndMutation/types` import in
// this codebase keeps working unchanged; it will be deleted once those
// call sites are repointed directly at "@universe/shared" (Goal 6).
export * from "@universe/shared";

// `CreatePostPayload`/`UpdatePostPayload` are generic over the upload file
// type in packages/shared (so the type has no DOM dependency); the web app
// always uploads a DOM `File`, so bind it once here rather than at every
// call site. Local declarations shadow the `export *` above for these two
// names — this is standard ES module semantics, not a redeclaration error.
import type {
  CreatePostPayload as CreatePostPayloadT,
  UpdatePostPayload as UpdatePostPayloadT,
} from "@universe/shared";

export type CreatePostPayload = CreatePostPayloadT<File>;
export type UpdatePostPayload = UpdatePostPayloadT<File>;
