export type UserRole = "user" | "admin";
export type AccountType = "normal" | "business";

export type User = {
  id: string;
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

export type CreatePostPayload = {
  title: string;
  body?: string;
  location?: string;
  tags: string;
  images: File[];
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
};

export type PostsPage = {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type PostAuthor = {
  id: string;
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
  actionUser?: NotificationActionUser | null;
};

export type NotificationsPage = {
  notifications: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
};
