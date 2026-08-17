import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

interface AttachmentInput {
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

const SHARED_POST_SELECT = {
  id: true,
  title: true,
  imagesUrls: true,
  user: {
    select: { id: true, firstName: true, lastName: true, name: true, profilePicture: true },
  },
} as const;

const MESSAGE_INCLUDE = {
  attachments: true,
  sharedPost: { select: SHARED_POST_SELECT },
} as const;

interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content?: string | null;
  imageUrls?: string[];
  imagePublicIds?: string[];
  audioUrl?: string | null;
  audioKey?: string | null;
  audioDurationSec?: number | null;
  attachments?: AttachmentInput[];
  sharedPostId?: string | null;
}

export const createMessage = async (data: CreateMessageInput) => {
  const {
    conversationId,
    senderId,
    receiverId,
    content,
    imagePublicIds,
    imageUrls,
    audioUrl,
    audioKey,
    audioDurationSec,
    attachments,
    sharedPostId,
  } = data;

  return prisma.message.create({
    data: {
      conversationId,
      senderId,
      receiverId,
      imageUrls: imageUrls ?? [],
      imagePublicIds: imagePublicIds ?? [],
      content: content || null,
      audioUrl: audioUrl || null,
      audioKey: audioKey || null,
      audioDurationSec: audioDurationSec ?? null,
      sharedPostId: sharedPostId ?? null,
      attachments:
        attachments && attachments.length > 0
          ? { create: attachments }
          : undefined,
    },
    include: MESSAGE_INCLUDE,
  });
};

export const findMessageById = async (id: string) => {
  return prisma.message.findUnique({ where: { id }, include: MESSAGE_INCLUDE });
};

interface CreateGroupMessageInput {
  senderId: string;
  groupId: string;
  messageText?: string | null;
  imageUrls?: string[];
  imagePublicIds?: string[];
  audioUrl?: string | null;
  audioKey?: string | null;
  audioDurationSec?: number | null;
  attachments?: AttachmentInput[];
  sharedPostId?: string | null;
}

export const createGroupMessage = async (data: CreateGroupMessageInput) => {
  const {
    senderId,
    groupId,
    messageText,
    imageUrls,
    imagePublicIds,
    audioUrl,
    audioKey,
    audioDurationSec,
    attachments,
    sharedPostId,
  } = data;

  return prisma.groupMessage.create({
    data: {
      senderId,
      groupId,
      content: messageText || null,
      imageUrls: imageUrls ?? [],
      imagePublicIds: imagePublicIds ?? [],
      audioUrl: audioUrl || null,
      audioKey: audioKey || null,
      audioDurationSec: audioDurationSec ?? null,
      sharedPostId: sharedPostId ?? null,
      attachments:
        attachments && attachments.length > 0
          ? { create: attachments }
          : undefined,
    },
    include: MESSAGE_INCLUDE,
  });
};

export const findGroupMessageById = async (id: string) => {
  return prisma.groupMessage.findUnique({
    where: { id },
    include: MESSAGE_INCLUDE,
  });
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
      ...MESSAGE_INCLUDE,
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toMessagePage(rows, limit);
};

export const countUnreadMessages = async (
  conversationId: string,
  userId: string,
  since: Date | null,
) => {
  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      deleted: false,
      ...(since ? { createdAt: { gt: since } } : {}),
    },
  });
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
      ...MESSAGE_INCLUDE,
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

export interface FilePageItem {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  messageId: string;
  createdAt: string;
}

export interface FilePage {
  items: FilePageItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

const toFilePage = (
  attachments: {
    id: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
    messageId: string | null;
    groupMessageId: string | null;
  }[],
  monthStart: Date,
  hasMore: boolean,
): FilePage => ({
  items: attachments.map((attachment) => ({
    id: attachment.id,
    fileUrl: attachment.fileUrl,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    messageId: (attachment.messageId ?? attachment.groupMessageId) as string,
    createdAt: attachment.createdAt.toISOString(),
  })),
  nextCursor: monthStart.toISOString(),
  hasMore,
});

export const getConversationFilesPage = async (
  conversationId: string,
  before?: string,
): Promise<FilePage> => {
  const beforeDate = before ? new Date(before) : undefined;

  const anchor = await prisma.attachment.findFirst({
    where: {
      message: { conversationId, deleted: false },
      ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!anchor) return { items: [], nextCursor: null, hasMore: false };

  const { monthStart, monthEnd } = monthRange(anchor.createdAt, beforeDate);

  const attachments = await prisma.attachment.findMany({
    where: {
      message: { conversationId, deleted: false },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { createdAt: "desc" },
  });

  const olderCount = await prisma.attachment.count({
    where: {
      message: { conversationId, deleted: false },
      createdAt: { lt: monthStart },
    },
  });

  return toFilePage(attachments, monthStart, olderCount > 0);
};

export const getGroupFilesPage = async (
  groupId: string,
  before?: string,
): Promise<FilePage> => {
  const beforeDate = before ? new Date(before) : undefined;

  const anchor = await prisma.attachment.findFirst({
    where: {
      groupMessage: { groupId, deleted: false },
      ...(beforeDate ? { createdAt: { lt: beforeDate } } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (!anchor) return { items: [], nextCursor: null, hasMore: false };

  const { monthStart, monthEnd } = monthRange(anchor.createdAt, beforeDate);

  const attachments = await prisma.attachment.findMany({
    where: {
      groupMessage: { groupId, deleted: false },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    orderBy: { createdAt: "desc" },
  });

  const olderCount = await prisma.attachment.count({
    where: {
      groupMessage: { groupId, deleted: false },
      createdAt: { lt: monthStart },
    },
  });

  return toFilePage(attachments, monthStart, olderCount > 0);
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
