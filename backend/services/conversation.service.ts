import {
  createConversation,
  findAllConversationsByParticipant,
  findConversationById,
  findConversationByParticipants,
} from "../repository/conversation.repository.js";
import {
  createMessage,
  findMessageById,
} from "../repository/message.repository.js";
import { prisma } from "../database/prisma.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { uploadImageAndCleanup } from "../lib/cloudinary.js";
import { createMessageNotification } from "../repository/notification.repository.js";
import { findUserById } from "../repository/user.repository.js";

import { getActiveConversationUsers } from "../lib/socket.js";

interface UploadedImage {
  path: string;
}

export const startConversation = async (data: {
  authUserId: string;
  otherUserId: string;
  messageData: string;
}) => {
  const { authUserId, otherUserId, messageData } = data;
  if (!messageData) throw new Error("No message");

  const conversation = await findConversationByParticipants(authUserId, otherUserId);
  if (conversation) throw new Error("Conversation already exists");

  const newConversation = await createConversation({ authUserId, otherUserId });
  const message = await createMessage({
    conversationId: newConversation.id,
    senderId: authUserId,
    receiverId: otherUserId,
    content: messageData,
  });
  await prisma.conversation.update({
    where: { id: newConversation.id },
    data: { lastMessageId: message.id },
  });

  io.to(getReceiverSocketId(otherUserId)).emit("newMesssage", message);
  return newConversation.id;
};

export const sendMessage = async (data: {
  convoId: string;
  messageText?: string;
  images?: UploadedImage[];
  authUserId: string;
}) => {
  const { convoId, messageText, images, authUserId } = data;
  const conversation = await findConversationById(convoId);
  if (!conversation) throw new Error("Conversation doesnt exist");

  let result: { secure_url: string; public_id: string }[] | undefined;
  if (images && images.length > 0) {
    result = await Promise.all(
      images.map((image) =>
        uploadImageAndCleanup(image.path, {
          folder: "message_images",
          resource_type: "image",
        }),
      ),
    );
  }

  const imageSecureUrls = result?.map((r) => r.secure_url);
  const imagePublicIds = result?.map((r) => r.public_id);

  const receiverId =
    conversation.participantOneId === authUserId
      ? conversation.participantTwoId
      : conversation.participantOneId;

  const message = await createMessage({
    senderId: authUserId,
    receiverId,
    conversationId: convoId,
    content: messageText,
    imageUrls: imageSecureUrls,
    imagePublicIds: imagePublicIds,
  });

  await prisma.conversation.update({
    where: { id: convoId },
    data: { lastMessageId: message.id },
  });

  const user = await findUserById(receiverId);

  const activeConversationUsers = getActiveConversationUsers(convoId);
  if (!activeConversationUsers?.has(receiverId)) {
    await createMessageNotification({
      actionUserId: authUserId,
      userId: receiverId,
      title: "New message",
      type: "message",
      message: `${user?.firstName || user?.name}: ${message?.content ? message.content : "IMAGE"}`,
      conversationId: convoId,
    });
  }

  io.to(getReceiverSocketId(receiverId)).emit("newMessage", message);
  return message;
};

export const deleteMessage = async (data: { messageId: string; authUserId: string }) => {
  const { messageId, authUserId } = data;
  const message = await findMessageById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.senderId !== authUserId) throw new Error("Unauthorized");
  await prisma.message.update({ where: { id: messageId }, data: { deleted: true } });
  io.to(getReceiverSocketId(message.receiverId)).emit("messageDeleted", messageId);
};

export const editMessage = async (data: {
  newContent: string;
  messageId: string;
  senderId: string;
}) => {
  const { newContent, messageId, senderId } = data;

  const message = await findMessageById(messageId);

  if (!message) throw new Error("Message not found");
  if (message.senderId !== senderId)
    throw new Error("No authorization to edit the message");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: newContent, edited: true },
  });
  io.to(getReceiverSocketId(message.receiverId)).emit("messageEdited", updated);
};

export const getUserConversations = async (userId: string) => {
  const conversations = await findAllConversationsByParticipant(userId);

  return conversations.map((convo) => ({
    id: convo.id,
    lastMessage: convo.lastMessage,
    updatedAt: convo.updatedAt,
    user: convo.participants.find((p) => p.id !== userId),
  }));
};
