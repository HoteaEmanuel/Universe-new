import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

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

const MESSAGE_ORDER_BY: Prisma.MessageOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

const GROUP_MESSAGE_ORDER_BY: Prisma.GroupMessageOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

interface MessagePage<T> {
  messages: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const toMessagePage = <T extends { id: string }>(
  rows: T[],
  limit: number,
): MessagePage<T> => {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1].id : null;
  return {
    messages: page.reverse(),
    nextCursor,
    hasMore,
  };
};

export const getConversationMessagesPage = async (
  conversationId: string,
  cursor?: string,
  limit = 30,
) => {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    take: limit + 1,
    orderBy: MESSAGE_ORDER_BY,
    include: {
      reactions: { select: { id: true, emoji: true, userId: true } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toMessagePage(rows, limit);
};

export const getGroupMessagesPage = async (
  groupId: string,
  cursor?: string,
  limit = 30,
) => {
  const rows = await prisma.groupMessage.findMany({
    where: { groupId },
    take: limit + 1,
    orderBy: GROUP_MESSAGE_ORDER_BY,
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          accountType: true,
          name: true,
        },
      },
      reactions: { select: { id: true, emoji: true, userId: true } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toMessagePage(rows, limit);
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
