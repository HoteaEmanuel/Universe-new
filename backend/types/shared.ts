// Shared literal-union types, kept in sync with the equivalent frontend shapes
// (frontend/src/features/profile/types.ts, frontend/src/features/chat/types.ts)
// so DTOs serialized from the backend match what the frontend expects.

export type AccountType = "normal" | "business";
export type UserRole = "user" | "admin";
export type GroupVisibility = "public" | "private";
export type GroupRole = "member" | "admin";
export type NotificationType = "post-like" | "post-comment" | "follow" | "message";
