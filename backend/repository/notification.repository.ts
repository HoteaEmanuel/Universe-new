import { prisma } from "../database/prisma.js";
import type { NotificationType } from "../types/shared.js";

const NOTIFICATION_ACTION_USER_SELECT = {
  id: true,
  profilePicture: true,
  firstName: true,
  lastName: true,
  name: true,
} as const;

interface NotificationPage<T> {
  notifications: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const toNotificationPage = <T extends { id: string }>(
  rows: T[],
  limit: number,
): NotificationPage<T> => {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    notifications: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    hasMore,
  };
};

export const getNotificationsPage = async (
  userId: string,
  cursor?: string,
  limit = 20,
) => {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { actionUser: { select: NOTIFICATION_ACTION_USER_SELECT } },
  });
  return toNotificationPage(rows, limit);
};

interface CreateNotificationInput {
  userId: string;
  actionUserId: string;
  type: NotificationType;
  title?: string;
  message?: string;
}

export const createNotification = async (data: CreateNotificationInput) => {
  const { userId, actionUserId, type, title, message } = data;
  return prisma.notification.create({
    data: {
      title,
      message,
      userId,
      actionUserId,
      type,
    },
    include: { actionUser: { select: NOTIFICATION_ACTION_USER_SELECT } },
  });
};

interface CreateMessageNotificationInput extends CreateNotificationInput {
  conversationId: string;
}

export const createMessageNotification = async (
  data: CreateMessageNotificationInput,
) => {
  const { userId, actionUserId, type, title, message, conversationId } = data;
  return prisma.notification.create({
    data: {
      title,
      message,
      userId,
      actionUserId,
      type,
      conversationId,
    },
    include: { actionUser: { select: NOTIFICATION_ACTION_USER_SELECT } },
  });
};

interface CreateGroupMessageNotificationInput extends CreateNotificationInput {
  groupId: string;
}

export const createGroupMessageNotification = async (
  data: CreateGroupMessageNotificationInput,
) => {
  const { userId, actionUserId, type, title, message, groupId } = data;
  return prisma.notification.create({
    data: {
      title,
      message,
      userId,
      actionUserId,
      type,
      groupId,
    },
    include: { actionUser: { select: NOTIFICATION_ACTION_USER_SELECT } },
  });
};
