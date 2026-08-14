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
