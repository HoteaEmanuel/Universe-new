import type { GroupVisibility, ResourceCategory } from "./domain.js";
import type { Poll } from "./poll.js";
import type { SharedPostPreview } from "./post.js";
import type { ChatUser, MentionUser } from "./user.js";
import type { CursorPage, NamedCursorPage } from "./pagination.js";

export type MessageReaction = {
  id: string;
  emoji: string;
  userId: string;
};

export type MessageAttachment = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
};

/** @deprecated use `SharedPostPreview` from ./post.js — identical shape. */
export type SharedPost = SharedPostPreview;

export type ChatMessage = {
  id: string;
  content?: string;
  imageUrls?: string[];
  audioUrl?: string;
  audioDurationSec?: number;
  attachments?: MessageAttachment[];
  sharedPost?: SharedPostPreview | null;
  poll?: Poll | null;
  senderId: string;
  sender?: ChatUser | null;
  conversationId?: string;
  groupId?: string;
  deleted?: boolean;
  edited?: boolean;
  reactions?: MessageReaction[];
  mentionedUsers?: MentionUser[];
  createdAt: string;
  updatedAt: string;
};

export type LastMessagePreview = {
  content?: string;
  imageUrls?: string[];
  audioUrl?: string;
  attachments?: MessageAttachment[];
  sharedPostId?: string | null;
  senderId?: string;
  sender?: ChatUser | null;
};

export type DirectConversation = {
  id: string;
  user?: ChatUser;
  lastMessage?: LastMessagePreview;
  updatedAt: string;
  unreadCount?: number;
  name?: undefined;
};

export type GroupConversation = {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  visibility?: GroupVisibility;
  university?: string | null;
  courseTag?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage?: LastMessagePreview;
  user?: undefined;
};

export type ConversationListEntry = DirectConversation | GroupConversation;

export type DirectConversationsPage = NamedCursorPage<"conversations", DirectConversation>;
export type GroupConversationsPage = NamedCursorPage<"groups", GroupConversation>;

export type ResourceType = "images" | "files"; // extend with "links" etc. as new resource tabs are added

/** @deprecated use `CursorPage<T>` from ./pagination.js — identical shape. */
export type ChatResourcePage<T> = CursorPage<T>;

export type ChatMediaItem = {
  url: string;
  messageId: string;
  createdAt: string;
};

export type ChatMediaPage = CursorPage<ChatMediaItem>;

export type ChatFileItem = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  messageId: string;
  createdAt: string;
};

export type ChatFilePage = CursorPage<ChatFileItem>;

export type ChatMessagePage = NamedCursorPage<"messages", ChatMessage> & {
  otherParticipantLastReadAt?: string | null;
  canSend?: boolean;
  viewerBlockedOther?: boolean;
};

export type MessageSearchPage = NamedCursorPage<"messages", ChatMessage>;

// A window of messages centered on one target message, for jumping straight
// to an arbitrary search result instead of paginating back through history.
// `hasOlder`/`olderCursor` only ever cover the direction beyond the window's
// older edge — the caller is expected to be anchored to this window (not the
// live bottom) while paginating further with them.
export type MessageContext = {
  messages: ChatMessage[];
  hasOlder: boolean;
  olderCursor: string | null;
};

export type BlockedUser = {
  id: string;
  createdAt: string;
  user: ChatUser;
};

export type GroupMember = {
  id: string;
  role: "admin" | "member" | string;
  memberId: string;
  member: ChatUser;
};

export type GroupMemberPage = CursorPage<GroupMember>;

export type GroupBan = {
  id: string;
  groupId: string;
  userId: string;
  bannedByUserId: string | null;
  reason?: string | null;
  createdAt: string;
  user: ChatUser;
  bannedBy: ChatUser | null;
};

export type GroupBanPage = CursorPage<GroupBan>;

export type CourseResource = {
  id: string;
  groupId: string;
  uploaderId: string;
  uploader: ChatUser;
  title: string;
  description?: string | null;
  category: ResourceCategory;
  week?: string | null;
  linkUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  pinned: boolean;
  downloadCount: number;
  helpfulCount: number;
  votedHelpful: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CourseResourcePage = CursorPage<CourseResource>;

// `TFile`/`TAudio` let each platform supply its own upload type (DOM `File`/
// `Blob` on web, `{ uri, name, type }` on React Native) without this package
// depending on DOM lib types.
export type NewCourseResourcePayload<TFile = unknown> = {
  title: string;
  description?: string;
  category: ResourceCategory;
  week?: string;
  linkUrl?: string;
  file?: TFile;
};

export type NewMessagePayload<TFile = unknown> = {
  messageText: string;
  images?: TFile[];
};

export type NewFilesMessagePayload<TFile = unknown> = {
  messageText: string;
  files: TFile[];
};

export type NewVoiceMessagePayload<TAudio = unknown> = {
  audio: TAudio;
  durationSec: number;
};
