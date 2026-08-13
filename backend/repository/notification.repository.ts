import { prisma } from "../database/prisma.js";
import type { NotificationType } from "../types/shared.js";

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
  });
};
