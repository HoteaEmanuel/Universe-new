export type ChatUser = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  profilePicture?: string | null;
  university?: string | null;
  accountType?: string;
};

export type MessageSender = ChatUser | string;

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

export type SharedPost = {
  id: string;
  title: string;
  imagesUrls: string[];
  user: ChatUser;
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

export type ChatMessage = {
  id: string;
  content?: string;
  imageUrls?: string[];
  audioUrl?: string;
  audioDurationSec?: number;
  attachments?: MessageAttachment[];
  sharedPost?: SharedPost | null;
  poll?: Poll | null;
  senderId: string;
  sender?: ChatUser | null;
  conversationId?: string;
  groupId?: string;
  deleted?: boolean;
  edited?: boolean;
  reactions?: MessageReaction[];
  createdAt: string;
  updatedAt: string;
};

export type LastMessagePreview = {
  content?: string;
  imageUrls?: string[];
  audioUrl?: string;
  attachments?: MessageAttachment[];
  sharedPostId?: string | null;
  senderId?: MessageSender;
};

export type DirectConversation = {
  id: string;
  user?: ChatUser;
  lastMessage?: LastMessagePreview;
  updatedAt: string;
  unreadCount?: number;
  name?: undefined;
};

export type GroupVisibility = "public" | "private";

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

export type ResourceType = "images" | "files"; // extend with "links" etc. as new resource tabs are added

export type ChatResourcePage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type ChatMediaItem = {
  url: string;
  messageId: string;
  createdAt: string;
};

export type ChatMediaPage = ChatResourcePage<ChatMediaItem>;

export type ChatFileItem = {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  messageId: string;
  createdAt: string;
};

export type ChatFilePage = ChatResourcePage<ChatFileItem>;

export type ChatMessagePage = {
  messages: ChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  otherParticipantLastReadAt?: string | null;
};

export type GroupMember = {
  id: string;
  role: "admin" | "member" | string;
  memberId: string;
  member: ChatUser;
};

export type NewMessagePayload = {
  messageText: string;
  images?: File[];
};

export type NewFilesMessagePayload = {
  messageText: string;
  files: File[];
};

export type NewVoiceMessagePayload = {
  audio: Blob;
  durationSec: number;
};

export type NewPollMessagePayload = {
  question: string;
  options: string[];
  closesAt?: string;
};
