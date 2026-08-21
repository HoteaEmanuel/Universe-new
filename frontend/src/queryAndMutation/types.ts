export type UserRole = "user" | "admin";
export type AccountType = "normal" | "business";

export type User = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  lastLogin?: string;
  isVerified: boolean;
  profilePicture?: string | null;
  profilePictureKey?: string | null;
  university?: string | null;
  major?: string | null;
  bio?: string | null;
  role: UserRole;
  googleId?: string | null;
  accountType: AccountType;
  identityVerified?: string;
  verificationCode?: string | null;
  verificationCodeExpiresAt?: string | null;
  refreshToken?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PollStatus = "open" | "closed";

export type PollOption = {
  id: string;
  text: string;
  position: number;
  voteCount: number;
};

export type Poll = {
  id: string;
  question: string;
  authorId: string;
  closesAt?: string | null;
  closedAt?: string | null;
  status: PollStatus;
  totalVotes: number;
  options: PollOption[];
};

export type CreatePollFields = {
  question: string;
  options: string[];
  closesAt?: string;
};

export type CreatePostPayload = {
  title: string;
  body?: string;
  location?: string;
  tags: string;
  images: File[];
  poll?: CreatePollFields;
};

export type UpdatePostPayload = {
  id: string;
  title: string;
  body: string;
  location?: string;
  tags: string;
  images: (File | string)[];
};

export type Post = {
  id: string;
  userId: string;
  title: string;
  body: string;
  location?: string;
  tags: string[];
  imagesUrls: string[];
  likes: string[];
  isSaved?: boolean;
  createdAt: string;
  event?: EventSummary | null;
  poll?: Poll | null;
  mentionedUsers: MentionUser[];
};

export type MentionUser = {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
};

export type EventVisibility = "public" | "private";
export type EventParticipantStatus = "going" | "interested" | "waitlisted";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";
export type EventType = "community" | "official";

export type EventPerson = {
  id: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
  accountType?: AccountType;
  identityVerified?: string;
  university?: string | null;
};

export type EventHostGroup = {
  id: string;
  name: string;
  coverImageUrl?: string | null;
};

export type EventSummary = {
  id: string;
  creatorId: string;
  creator: EventPerson;
  hostGroupId?: string | null;
  hostGroup?: EventHostGroup | null;
  title: string;
  description?: string | null;
  location?: string | null;
  virtualUrl?: string | null;
  coverImageUrl?: string | null;
  coverImageKey?: string | null;
  startAt: string;
  endAt?: string | null;
  visibility: EventVisibility;
  capacity?: number | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status: EventStatus;
  eventType: EventType;
  coordinationGroup?: { id: string } | null;
  announcementPost?: { id: string } | null;
};

export type EventParticipantCounts = Record<EventParticipantStatus, number>;

export type EventParticipant = {
  id: string;
  eventId: string;
  userId: string;
  status: EventParticipantStatus;
  createdAt: string;
  updatedAt: string;
};

export type EventDetails = EventSummary & {
  counts: EventParticipantCounts;
  viewerParticipation: EventParticipant | null;
};

export type EventsPage = {
  events: EventSummary[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type EventParticipantWithUser = EventParticipant & { user: EventPerson };

export type EventParticipantsPage = {
  items: EventParticipantWithUser[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type EventBan = {
  id: string;
  eventId: string;
  userId: string;
  bannedByUserId: string | null;
  reason?: string | null;
  createdAt: string;
  user: EventPerson;
  bannedBy: EventPerson | null;
};

export type EventBansPage = {
  items: EventBan[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type CreateEventPayload = {
  title: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt: string;
  endAt?: string;
  visibility?: EventVisibility;
  capacity?: number;
  hostGroupId?: string;
};

export type UpdateEventPayload = Partial<
  Omit<CreateEventPayload, "visibility" | "hostGroupId">
>;

export type PostsPage = {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type PostAuthor = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
};

export type UsersWhoLikedPage = {
  users: PostAuthor[];
  nextCursor: string | null;
  hasMore: boolean;
};

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

export type FollowUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
  university?: string;
  accountType?: AccountType;
};

export type FollowListPage = {
  users: FollowUser[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type UniversityPeoplePage = {
  people: FollowUser[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type PostComment = {
  id: string;
  userId: string;
  postId: string;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  parentId?: string | null;
  repliesCount?: number;
  mentionedUsers: MentionUser[];
};

export type PostCommentsPage = {
  comments: PostComment[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type SearchPage<T> = {
  items: T[];
  hasMore: boolean;
};

export type NotificationActionUser = {
  id: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
};

export type Notification = {
  id: string;
  title?: string | null;
  message?: string | null;
  type?: string | null;
  read: boolean;
  createdAt: string;
  conversationId?: string | null;
  groupId?: string | null;
  eventId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  actionUser?: NotificationActionUser | null;
};

export type NotificationsPage = {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
};
