export type ChatUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
  university?: string;
  accountType?: string;
};

export type MessageSender = ChatUser | string;

export type ChatMessage = {
  id: string;
  content?: string;
  imageUrls?: string[];
  senderId: MessageSender;
  conversationId?: string;
  groupId?: string;
  deleted?: boolean;
  edited?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LastMessagePreview = {
  content?: string;
  senderId?: MessageSender;
};

export type DirectConversation = {
  id: string;
  user?: ChatUser;
  lastMessage?: LastMessagePreview;
  name?: undefined;
};

export type GroupVisibility = "public" | "private";

export type GroupConversation = {
  id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  visibility?: GroupVisibility;
  createdAt: string;
  lastMessage?: LastMessagePreview;
  user?: undefined;
};

export type ConversationListEntry = DirectConversation | GroupConversation;

export type ChatMediaItem = {
  url: string;
  messageId: string;
  createdAt: string;
};

export type ChatMediaPage = {
  items: ChatMediaItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type GroupMember = {
  id: string;
  role: "admin" | "member" | string;
  memberId: ChatUser;
};

export type NewMessagePayload = {
  messageText: string;
  images?: File[];
};
