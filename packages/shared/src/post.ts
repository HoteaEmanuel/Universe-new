import type { OpportunityType, PostType, WorkplaceType } from "./domain.js";
import type { EventSummary } from "./event.js";
import type { CreatePollFields, Poll } from "./poll.js";
import type { MentionUser, PostAuthor } from "./user.js";
import type { NamedCursorPage } from "./pagination.js";

export type Post = {
  id: string;
  userId: string;
  title: string;
  body: string;
  location?: string;
  tags: string[];
  imagesUrls: string[];
  isSaved?: boolean;
  createdAt: string;
  event?: EventSummary | null;
  poll?: Poll | null;
  mentionedUsers: MentionUser[];
  type: PostType;
  opportunityType?: OpportunityType | null;
  workplaceType?: WorkplaceType | null;
  companyName?: string | null;
  applyUrl?: string | null;
  deadlineAt?: string | null;
  expiresAt?: string | null;
  opportunityClosedAt?: string | null;
  isOpportunityExpired?: boolean;
};

export type PostsPage = NamedCursorPage<"posts", Post>;

// `TFile` lets each platform supply its own upload type — a DOM `File` on
// web, `{ uri, name, type }` on React Native — without this package
// depending on DOM lib types.
export type CreatePostPayload<TFile = unknown> = {
  title: string;
  body?: string;
  location?: string;
  tags: string;
  images: TFile[];
  poll?: CreatePollFields;
  type?: PostType;
  opportunityType?: OpportunityType;
  workplaceType?: WorkplaceType;
  companyName?: string;
  applyUrl?: string;
  deadlineAt?: string;
  expiresAt?: string;
};

export type UpdatePostPayload<TFile = unknown> = {
  id: string;
  title: string;
  body: string;
  location?: string;
  tags: string;
  images: (TFile | string)[];
  type?: PostType;
  opportunityType?: OpportunityType;
  workplaceType?: WorkplaceType;
  companyName?: string;
  applyUrl?: string;
  deadlineAt?: string;
};

export type OpportunityFilters = {
  q?: string;
  opportunityType?: OpportunityType;
  workplaceType?: WorkplaceType;
  location?: string;
  status?: "active" | "expired" | "all";
  sort?: "newest" | "deadline";
  savedOnly?: boolean;
};

export type OpportunitiesPage = PostsPage;

export type UsersWhoLikedPage = NamedCursorPage<"users", PostAuthor>;
export type RelevantLiker = PostAuthor | null;

export type ShareRecipient = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
  lastInteractionAt: string;
};

export type ShareRecipientGroup = {
  id: string;
  name: string;
  coverImageUrl: string | null;
  visibility: "public" | "private";
  lastActivityAt: string;
};

export type ShareRecipientsResponse = {
  recipients: ShareRecipient[];
  groups: ShareRecipientGroup[];
};

// Shared with chat.ts's `SharedPost` — a post preview embedded in a message.
export type SharedPostPreview = {
  id: string;
  title: string;
  imagesUrls: string[];
  user: PostAuthor;
};

export type PublicPost = {
  id: string;
  title: string;
  body?: string;
  location?: string;
  imagesUrls: string[];
  createdAt: string;
  tags: { name: string }[];
  user: PostAuthor;
  _count: { likes: number; comments: number };
};

export type PostComment = {
  id: string;
  userId: string | null;
  postId: string;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  parentId?: string | null;
  repliesCount?: number;
  mentionedUsers: MentionUser[];
  isBlocked?: boolean;
  isRemoved?: boolean;
};

export type PostCommentsPage = NamedCursorPage<"comments", PostComment>;
