import type { Request, Response } from "express";
import type {} from "multer";
import { prisma } from "../database/prisma.js";
import { findConversationByParticipants } from "../repository/conversation.repository.js";
import { getConversationMediaPage } from "../repository/message.repository.js";

import {
  deleteMessage,
  editMessage,
  getUserConversations,
  sendMessage,
  startConversation,
} from "../services/conversation.service.js";

const PARTICIPANT_OMIT = {
  password: true,
  resetPasswordToken: true,
  resetPasswordExpiresAt: true,
  refreshToken: true,
  verificationCode: true,
  verificationCodeExpiresAt: true,
  isVerified: true,
  email: true,
} as const;

export const getConvoById = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const convo = await prisma.conversation.findUnique({ where: { id: convoId } });
    if (!convo) throw new Error("Conversation not found");
    return res.status(200).json({
      message: "Conversation found successfully",
      conversation: convo,
    });
  } catch (error) {
    return res.status(200).json({ error });
  }
};

export const getConvoUser = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const authUser = req.userId as string;
    const convo = await prisma.conversation.findUnique({ where: { id: convoId } });
    if (!convo) throw new Error("Conversation not found");
    const otherUserId =
      convo.participantOneId === authUser
        ? convo.participantTwoId
        : convo.participantOneId;
    const user = await prisma.user.findUnique({
      where: { id: otherUserId },
      omit: PARTICIPANT_OMIT,
    });
    return res.status(200).json({ message: "User found", user });
  } catch (error) {}
};

export const getConversationsController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const conversations = await getUserConversations(userId);
    return res.status(200).json({
      message: "Fetched the conversations",
      conversations,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getConvoUsers = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ participantOneId: userId }, { participantTwoId: userId }] },
      include: {
        participantOne: { omit: PARTICIPANT_OMIT },
        participantTwo: { omit: PARTICIPANT_OMIT },
      },
    });
    const convoUsers = conversations.map((convo) =>
      convo.participantOneId === userId ? convo.participantTwo : convo.participantOne,
    );
    return res
      .status(200)
      .json({ message: "Fetched the conversation users", users: convoUsers });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getConversationByUserIds = async (req: Request, res: Response) => {
  try {
    const receiverId = req.params.id as string;
    const senderId = req.userId as string;
    if (receiverId === senderId) throw new Error("Same users");
    const conversation = await findConversationByParticipants(senderId, receiverId);
    return res.status(200).json({
      message: "Conversation found",
      conversation,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    if (!convoId) throw new Error("No convo id provided");
    const messages = await prisma.message.findMany({
      where: { conversationId: convoId },
      orderBy: { createdAt: "asc" },
    });
    return res
      .status(200)
      .json({ message: "Fetched the messages successfully", messages });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getConvoMediaController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const before = req.query.before as string | undefined;
    const page = await getConversationMediaPage(convoId, before);
    return res.status(200).json({ message: "Fetched the conversation media", ...page });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const startConversationController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id as string;
    const authUserId = req.userId as string;
    const { message: messageData } = req.body;
    const newConversationId = await startConversation({
      authUserId,
      otherUserId: userId,
      messageData,
    });
    return res.status(201).json({ message: "Conversation started", id: newConversationId });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const sendMessageController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const authUserId = req.userId as string;
    const { messageText } = req.body;
    const images = req.files as Express.Multer.File[] | undefined;
    const message = await sendMessage({ convoId, authUserId, messageText, images });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const deleteMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id as string;
    const authUserId = req.userId as string;
    await deleteMessage({ messageId, authUserId });
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};

export const editMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id as string;
    const authUserId = req.userId as string;
    const { newContent } = req.body;
    await editMessage({ newContent, senderId: authUserId, messageId });
    return res.status(200).json({ message: "Message edited successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};
