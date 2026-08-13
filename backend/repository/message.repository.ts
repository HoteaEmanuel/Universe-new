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
