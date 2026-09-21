import type { AccountType, UserRole } from "./domain.js";
import type { NamedCursorPage } from "./pagination.js";


/** The full authenticated user shape, as returned from auth/session endpoints. */
export type User = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  lastLogin?: string;
  isVerified: boolean;
  hasCompletedOnboarding: boolean;
  hasSeenAppTour: boolean;
  profilePicture?: string | null;
  profilePictureKey?: string | null;
  university?: string | null;
  major?: string | null;
  bio?: string | null;
  role: UserRole;
  googleId?: string | null;
  accountType: AccountType;
  identityVerified?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** The minimal author/mention shape used in feeds, comments and notifications. */
export type UserSummary = {
  id: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
};

// Unlike the other UserSummary-shaped views, `username` here is required —
// a mention always resolves to a concrete @handle.
export type MentionUser = UserSummary & { username: string };
export type PostAuthor = UserSummary;
export type NotificationActionUser = UserSummary;

export type FollowUser = UserSummary & {
  university?: string;
  accountType?: AccountType;
};

export type FollowListPage = NamedCursorPage<"users", FollowUser>;
export type UniversityPeoplePage = NamedCursorPage<"people", FollowUser>;

export type EventPerson = UserSummary & {
  accountType?: AccountType;
  identityVerified?: string;
  university?: string | null;
};

// Was previously typed with `accountType?: string` in features/chat/types.ts
// — a real loosening versus every other user variant using `AccountType`.
export type ChatUser = UserSummary & {
  university?: string | null;
  accountType?: AccountType;
};

export type ReportUserSummary = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
};

/** The profile-page shape: a UserSummary plus the fields a profile displays. */
export type ProfileUser = UserSummary & {
  username: string;
  university?: string | null;
  major?: string | null;
  bio?: string | null;
  accountType?: AccountType;
};
