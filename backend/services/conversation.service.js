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
import { getReceiverSocketId, io } from "../lib/socket.js";
import { v2 as cloudinary } from "cloudinary";
import {
  createMessageNotification,
  createNotification,
} from "../repository/notification.repository.js";
import { findUserById } from "../repository/user.repository.js";

import { getActiveConversationUsers } from "../lib/socket.js";
export const startConversation = async (data) => {
  const { authUserId, otherUserId, messageData } = data;
  if (!messageData) throw new Error("No message");
  console.log("NEW CONV SERVICE");
  console.log(authUserId, otherUserId, messageData);

  const conversation = await findConversationByParticipants(
    authUserId,
    otherUserId,
  );
  if (conversation) throw new Error("Conversation already exists");
  console.log("CREATING A CONVO");
  const newConversation = await createConversation(data);
  console.log("CONVO CREATED: ", newConversation);
  const messageBody = {
    conversationId: newConversation._id,
    senderId: authUserId,
    receiverId: otherUserId,
    content: messageData,
  };
  console.log("AICI");
  const message = await createMessage(messageBody);
  console.log("MESS: ", message);
  message.conversationId = newConversation._id;
  console.log("HERE");
  newConversation.lastMessage = message;
  await newConversation.save();
  await message.save();
  io.to(getReceiverSocketId(otherUserId.toString())).emit(
    "newMesssage",
    message,
  );
  const newConversationId = newConversation._id;
  console.log("NEW CONVERSATION CREATED");
  return newConversationId;
};

export const sendMessage = async (data) => {
  console.log("SEND MESSAGE");
  const { convoId, messageText, images, authUserId } = data;
  console.log(convoId, messageText, images);
  let conversation = await findConversationById(convoId);
  if (!conversation) throw new Error("Conversation doesnt exist");

  let result = undefined;
  if (images && images.length > 0) {
    result = await Promise.all(
      images.map((image) =>
        cloudinary.uploader.upload(image.path, {
          folder: "message_images",
          resource_type: "image",
        }),
      ),
    );
  }

  const imageSecureUrls = result ? result.map((r) => r.secure_url) : null;
  const imagePublicIds = result ? result.map((r) => r.public_id) : null;

  const userId = conversation.participants[0].equals(authUserId)
    ? conversation.participants[1]
    : conversation.participants[0];

  const messageData = {
    senderId: authUserId,
    receiverId: userId.toString(),
    conversationId: convoId,
    content: messageText,
    imageUrls: imageSecureUrls,
    imagePublicIds: imagePublicIds,
  };

  const message = await createMessage(messageData);

  message.content = messageText;
  if (result && result.length > 0)
    message.images = result.map((img) => ({ publicId: img.public_id }));
  conversation.lastMessage = message;
  await conversation.save();
  await message.save();
  const user = await findUserById(userId);
  console.log("USER FOUND : ", user);

  const activeConversationUsers = getActiveConversationUsers(convoId);
  console.log("CONVO INFO:")
  console.log(activeConversationUsers);
  console.log(userId)
  if (!activeConversationUsers.has(userId.toString())) {
    const notifData = {
      actionUserId: authUserId,
      userId: userId,
      title: "New message",
      type: "message",
      message: `${user?.firstName || user?.name}: ${message?.content ? message.content : "IMAGE"}`,
      conversationId: convoId,
    };

    const notification = await createMessageNotification(notifData);
    console.log("NOTIF: ", notification);
  }

  io.to(getReceiverSocketId(userId.toString())).emit("newMessage", message);
  return message;
};

export const deleteMessage = async (data) => {
  const { messageId, authUserId } = data;
  const message = await findMessageById(messageId);
  if (!message) throw new Error("Message not found");
  if (message.senderId.toString() !== authUserId.toString())
    throw new Error("Unauthorized");
  message.deleted = true;
  await message.save();
  io.to(getReceiverSocketId(message.receiverId.toString())).emit(
    "messageDeleted",
    messageId,
  );
};

export const editMessage = async (data) => {
  const { newContent, messageId, senderId } = data;

  const message = await findMessageById(messageId);

  if (!message) throw new Error("Message not found");
  if (message.senderId.toString() !== senderId)
    throw new Error("No authorization to edit the message");
  message.content = newContent;
  message.edited = true;
  message.updatedAt = Date.now();
  await message.save();
  io.to(getReceiverSocketId(message.receiverId.toString())).emit(
    "messageEdited",
    message,
  );
};

export const getUserConversations = async (userId) => {
  const conversations = await findAllConversationsByParticipant(userId);

  const convoUsers = conversations.map((convo) =>
    convo.participants.find((p) => !p._id.equals(userId)),
  );
  console.log("DEBUG CONVOS");
  console.log(conversations);
  for (let i = 0; i < conversations.length; i++) {
    conversations[i] = {
      _id: conversations[i]._id,
      lastMessage: conversations[i].lastMessage,
      user: convoUsers[i],
    };
  }

  return conversations;
};
