import { prisma } from "../database/prisma.js";

interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content?: string | null;
  imageUrls?: string[];
  imagePublicIds?: string[];
}

export const createMessage = async (data: CreateMessageInput) => {
  const { conversationId, senderId, receiverId, content, imagePublicIds, imageUrls } =
    data;

  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      receiverId,
      imageUrls: imageUrls ?? [],
      imagePublicIds: imagePublicIds ?? [],
      content: content || null,
    },
  });
};

export const findMessageById = async (id: string) => {
  return prisma.message.findUnique({ where: { id } });
};

interface CreateGroupMessageInput {
  senderId: string;
  groupId: string;
  messageText?: string | null;
  imageUrls?: string[];
  imagePublicIds?: string[];
}

export const createGroupMessage = async (data: CreateGroupMessageInput) => {
  const { senderId, groupId, messageText, imageUrls, imagePublicIds } = data;

  return prisma.groupMessage.create({
    data: {
      senderId,
      groupId,
      content: messageText || null,
      imageUrls: imageUrls ?? [],
      imagePublicIds: imagePublicIds ?? [],
    },
  });
};

export const findGroupMessageById = async (id: string) => {
  return prisma.groupMessage.findUnique({ where: { id } });
};

export interface MediaPageItem {
  url: string;
  messageId: string;
  createdAt: string;
}

export interface MediaPage {
  items: MediaPageItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

const monthRange = (anchorCreatedAt: Date, before?: Date) => {
  const monthStart = new Date(
    Date.UTC(anchorCreatedAt.getUTCFullYear(), anchorCreatedAt.getUTCMonth(), 1),
  );
  const monthEnd =
    before ??
    new Date(
      Date.UTC(anchorCreatedAt.getUTCFullYear(), anchorCreatedAt.getUTCMonth() + 1, 1),
    );
  return { monthStart, monthEnd };
};

const toMediaPage = (
  messages: { id: string; imageUrls: string[]; createdAt: Date }[],
  monthStart: Date,
  hasMore: boolean,
): MediaPage => ({
  items: messages.flatMap((message) =>
    message.imageUrls.map((url) => ({
      url,
      messageId: message.id,
      createdAt: message.createdAt.toISOString(),
    })),
  ),
  nextCursor: monthStart.toISOString(),
  hasMore,
});

export const getConversationMediaPage = async (
  conversationId: string,
  before?: string,
): Promise<MediaPage> => {
  const beforeDate = before ? new Date(before) : undefined;

  const anchor = await prisma.message.findFirst({
    where: {
      conversationId,
      deleted: false,
      imageUrls: { isEmpty: false },
      ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!anchor) return { items: [], nextCursor: null, hasMore: false };

  const { monthStart, monthEnd } = monthRange(anchor.createdAt, beforeDate);

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deleted: false,
      imageUrls: { isEmpty: false },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, imageUrls: true, createdAt: true },
  });

  const olderCount = await prisma.message.count({
    where: {
      conversationId,
      deleted: false,
      imageUrls: { isEmpty: false },
      createdAt: { lt: monthStart },
    },
  });

  return toMediaPage(messages, monthStart, olderCount > 0);
};

export const getGroupMediaPage = async (
  groupId: string,
  before?: string,
): Promise<MediaPage> => {
  const beforeDate = before ? new Date(before) : undefined;

  const anchor = await prisma.groupMessage.findFirst({
    where: {
      groupId,
      deleted: false,
      imageUrls: { isEmpty: false },
      ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!anchor) return { items: [], nextCursor: null, hasMore: false };

  const { monthStart, monthEnd } = monthRange(anchor.createdAt, beforeDate);

  const messages = await prisma.groupMessage.findMany({
    where: {
      groupId,
      deleted: false,
      imageUrls: { isEmpty: false },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, imageUrls: true, createdAt: true },
  });

  const olderCount = await prisma.groupMessage.count({
    where: {
      groupId,
      deleted: false,
      imageUrls: { isEmpty: false },
      createdAt: { lt: monthStart },
    },
  });

  return toMediaPage(messages, monthStart, olderCount > 0);
};
