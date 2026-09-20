// Moved to packages/shared/src (Phase 0 of the monorepo + shared package
// feature — see context/features/mobile-foundation-reset.md). This file is
// a re-export shim so every existing `@/features/chat/types` import in this
// codebase keeps working unchanged; it will be deleted once those call
// sites are repointed directly at "@universe/shared" (Goal 6).
export * from "@universe/shared";

// These payload types are generic over the upload file/audio type in
// packages/shared (so the type has no DOM dependency); the web app always
// uploads a DOM `File`/`Blob`, so bind it once here rather than at every
// call site. Local declarations shadow the `export *` above for these
// names — this is standard ES module semantics, not a redeclaration error.
import type {
  NewCourseResourcePayload as NewCourseResourcePayloadT,
  NewFilesMessagePayload as NewFilesMessagePayloadT,
  NewMessagePayload as NewMessagePayloadT,
  NewVoiceMessagePayload as NewVoiceMessagePayloadT,
} from "@universe/shared";

export type NewCourseResourcePayload = NewCourseResourcePayloadT<File>;
export type NewMessagePayload = NewMessagePayloadT<File>;
export type NewFilesMessagePayload = NewFilesMessagePayloadT<File>;
export type NewVoiceMessagePayload = NewVoiceMessagePayloadT<Blob>;
