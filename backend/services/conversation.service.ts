import {
  createConversation,
  findAllConversationsByParticipant,
  findConversationById,
  findConversationByParticipants,
  markConversationRead as markConversationReadRepo,
} from "../repository/conversation.repository.js";
import {
  createMessage,
  countUnreadMessages,
  findMessageById,
} from "../repository/message.repository.js";
import { prisma } from "../database/prisma.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { uploadImage, deleteImages } from "../lib/storage.js";
import {
  createMessageNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { findPostById } from "../repository/post.repository.js";

import { getActiveConversationUsers } from "../lib/socket.js";

type UploadedImage = Express.Multer.File;

const notificationPreviewText = (message: {
  content?: string | null;
  audioUrl?: string | null;
  attachments?: { fileName: string }[];
  sharedPost?: { id: string } | null;
}) => {
  if (message.content) return message.content;
  if (message.sharedPost) return "Shared a post";
  if (message.audioUrl) return "Voice message";
  if (message.attachments && message.attachments.length > 0) return "FILE";
  return "IMAGE";
};

const finalizeNewMessage = async (data: {
  convoId: string;
  authUserId: string;
  receiverId: string;
  message: Awaited<ReturnType<typeof createMessage>>;
}) => {
  const { convoId, authUserId, receiverId, message } = data;

  await prisma.conversation.update({
    where: { id: convoId },
    data: { lastMessageId: message.id },
  });

  const sender = await findUserById(authUserId);

  const activeConversationUsers = getActiveConversationUsers(convoId);
  if (!activeConversationUsers?.has(receiverId)) {
    const notification = await createMessageNotification({
      actionUserId: authUserId,
      userId: receiverId,
      title: "New message",
      type: "message",
      message: `${sender?.firstName || sender?.name}: ${notificationPreviewText(message)}`,
      conversationId: convoId,
    });
    await emitNewNotification(receiverId, notification);
  } else {
    await markConversationRead({ convoId, userId: receiverId });
  }

  io.to(getReceiverSocketId(receiverId)).emit("newMessage", message);
  return message;
};

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

  let uploaded: { url: string; key: string }[] | undefined;
  if (images && images.length > 0) {
    uploaded = await Promise.all(
      images.map((image) =>
        uploadImage({
          buffer: image.buffer,
          mimeType: image.mimetype,
          folder: "message_images",
        }),
      ),
    );
  }

  const imageSecureUrls = uploaded?.map((u) => u.url);
  const imagePublicIds = uploaded?.map((u) => u.key);

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

  return finalizeNewMessage({ convoId, authUserId, receiverId, message });
};

export const sendFilesMessage = async (data: {
  convoId: string;
  messageText?: string;
  files: UploadedImage[];
  authUserId: string;
}) => {
  const { convoId, messageText, files, authUserId } = data;
  const conversation = await findConversationById(convoId);
  if (!conversation) throw new Error("Conversation doesnt exist");

  const uploaded = await Promise.all(
    files.map(async (file) => {
      const { url, key } = await uploadImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        folder: "message_files",
      });
      return {
        fileUrl: url,
        fileKey: key,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      };
    }),
  );

  const receiverId =
    conversation.participantOneId === authUserId
      ? conversation.participantTwoId
      : conversation.participantOneId;

  const message = await createMessage({
    senderId: authUserId,
    receiverId,
    conversationId: convoId,
    content: messageText,
    attachments: uploaded,
  });

  return finalizeNewMessage({ convoId, authUserId, receiverId, message });
};

export const sendVoiceMessage = async (data: {
  convoId: string;
  authUserId: string;
  audio: UploadedImage;
  durationSec: number;
}) => {
  const { convoId, authUserId, audio, durationSec } = data;
  const conversation = await findConversationById(convoId);
  if (!conversation) throw new Error("Conversation doesnt exist");

  const uploaded = await uploadImage({
    buffer: audio.buffer,
    mimeType: audio.mimetype,
    folder: "message_audio",
  });

  const receiverId =
    conversation.participantOneId === authUserId
      ? conversation.participantTwoId
      : conversation.participantOneId;

  const message = await createMessage({
    senderId: authUserId,
    receiverId,
    conversationId: convoId,
    audioUrl: uploaded.url,
    audioKey: uploaded.key,
    audioDurationSec: durationSec,
  });

  return finalizeNewMessage({ convoId, authUserId, receiverId, message });
};

export const sharePostToUsers = async (data: {
  authUserId: string;
  postId: string;
  recipientIds: string[];
}) => {
  const { authUserId, postId, recipientIds } = data;
  const post = await findPostById(postId);
  if (!post) throw new Error("Post not found");

  const uniqueRecipientIds = Array.from(new Set(recipientIds)).filter(
    (id) => id !== authUserId,
  );
  if (uniqueRecipientIds.length === 0) throw new Error("No recipients provided");

  return Promise.all(
    uniqueRecipientIds.map(async (receiverId) => {
      const conversation =
        (await findConversationByParticipants(authUserId, receiverId)) ??
        (await createConversation({ authUserId, otherUserId: receiverId }));

      const message = await createMessage({
        senderId: authUserId,
        receiverId,
        conversationId: conversation.id,
        sharedPostId: postId,
      });

      return finalizeNewMessage({
        convoId: conversation.id,
        authUserId,
        receiverId,
        message,
      });
    }),
  );
};

export const markConversationRead = async (data: { convoId: string; userId: string }) => {
  const { convoId, userId } = data;
  const conversation = await markConversationReadRepo(convoId, userId);
  if (!conversation) return null;

  const otherUserId =
    conversation.participantOneId === userId
      ? conversation.participantTwoId
      : conversation.participantOneId;

  io.to(getReceiverSocketId(otherUserId)).emit("conversationRead", {
    convoId,
    readAt: (userId === conversation.participantOneId
      ? conversation.lastReadAtParticipantOne
      : conversation.lastReadAtParticipantTwo
    )?.toISOString(),
  });

  return conversation;
};

export const deleteMessage = async (data: { messageId: string }) => {
  const { messageId } = data;
  const message = await findMessageById(messageId);
  if (!message) throw new Error("Message not found");
  await prisma.message.update({ where: { id: messageId }, data: { deleted: true } });

  const keysToDelete = [
    ...message.imagePublicIds,
    ...(message.audioKey ? [message.audioKey] : []),
    ...message.attachments.map((attachment) => attachment.fileKey),
  ];
  if (keysToDelete.length > 0) {
    deleteImages(keysToDelete).catch((error: unknown) => {
      console.error(`Failed to delete storage objects for message ${messageId}:`, error);
    });
  }

  io.to(getReceiverSocketId(message.receiverId)).emit("messageDeleted", messageId);
};

export const editMessage = async (data: {
  newContent: string;
  messageId: string;
}) => {
  const { newContent, messageId } = data;

  const message = await findMessageById(messageId);

  if (!message) throw new Error("Message not found");

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: newContent, edited: true },
  });
  io.to(getReceiverSocketId(message.receiverId)).emit("messageEdited", updated);
};

export const setMessageReaction = async (data: {
  messageId: string;
  userId: string;
  emoji: string;
}) => {
  const { messageId, userId, emoji } = data;
  const message = await findMessageById(messageId);
  if (!message) throw new Error("Message not found");

  const otherUserId =
    message.senderId === userId ? message.receiverId : message.senderId;

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId: { messageId, userId } },
  });

  if (existing?.emoji === emoji) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
    io.to(getReceiverSocketId(otherUserId)).emit("reactionRemoved", {
      messageId,
      userId,
      emoji,
    });
    return { removed: true, messageId, userId, emoji };
  }

  const reaction = await prisma.messageReaction.upsert({
    where: { messageId_userId: { messageId, userId } },
    update: { emoji },
    create: { messageId, userId, emoji },
  });
  io.to(getReceiverSocketId(otherUserId)).emit("reactionAdded", reaction);
  return { removed: false, reaction };
};

export const getUserConversations = async (userId: string) => {
  const conversations = await findAllConversationsByParticipant(userId);

  return Promise.all(
    conversations.map(async (convo) => {
      const myLastReadAt =
        convo.participantOneId === userId
          ? convo.lastReadAtParticipantOne
          : convo.lastReadAtParticipantTwo;

      return {
        id: convo.id,
        lastMessage: convo.lastMessage,
        updatedAt: convo.updatedAt,
        user: convo.participants.find((p) => p.id !== userId),
        unreadCount: await countUnreadMessages(convo.id, userId, myLastReadAt),
      };
    }),
  );
};
