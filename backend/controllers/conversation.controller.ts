import type { Request, Response } from "express";
import type {} from "multer";
import { prisma } from "../database/prisma.js";
import {
  findConversationByParticipants,
  findConversationReadCursors,
  findConversationArchiveState,
} from "../repository/conversation.repository.js";
import {
  getConversationFilesPage,
  getConversationMediaPage,
  getConversationMessagesPage,
} from "../repository/message.repository.js";
import { findBlockEitherDirection } from "../repository/block.repository.js";
import type { ConversationsListQueryInput } from "../schemas/conversation.schema.js";

import {
  deleteMessage,
  editMessage,
  getUserConversations,
  getArchivedConversations,
  markConversationRead,
  sendMessage,
  sendFilesMessage,
  sendVoiceMessage,
  startConversation,
  setMessageReaction,
  archiveConversation,
  unarchiveConversation,
  deleteConversationForMe,
  MessageNotAllowedError,
} from "../services/conversation.service.js";

// Deliberately generic - the code and message here must never change based
// on why a send was rejected (block vs. deactivated account vs. a future DM
// restriction), so inspecting the response can't reveal which one it was.
const MESSAGE_NOT_ALLOWED_RESPONSE = {
  code: "MESSAGE_NOT_ALLOWED",
  message: "You can't send messages to this conversation.",
} as const;

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
    const { cursor, search, limit } = req.query as unknown as ConversationsListQueryInput;
    const { conversations, nextCursor, hasMore } = await getUserConversations(userId, {
      cursor,
      search,
      limit,
    });
    return res.status(200).json({
      message: "Fetched the conversations",
      conversations,
      nextCursor,
      hasMore,
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
    const userId = req.userId as string;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit as unknown as number;

    const archiveState = await findConversationArchiveState(convoId);
    const isParticipantOne = archiveState?.participantOneId === userId;
    const myClearedAt = archiveState
      ? isParticipantOne
        ? archiveState.clearedAtParticipantOne
        : archiveState.clearedAtParticipantTwo
      : null;
    const otherUserId = archiveState
      ? isParticipantOne
        ? archiveState.participantTwoId
        : archiveState.participantOneId
      : null;

    const [page, cursors, block] = await Promise.all([
      getConversationMessagesPage(convoId, cursor, limit, myClearedAt),
      findConversationReadCursors(convoId),
      otherUserId ? findBlockEitherDirection(userId, otherUserId) : null,
    ]);
    const otherParticipantLastReadAt = cursors
      ? (cursors.participantOneId === userId
          ? cursors.lastReadAtParticipantTwo
          : cursors.lastReadAtParticipantOne)
      : null;

    // canSend/viewerBlockedOther are the only block-related fields ever
    // returned here, and both are safe from either side's perspective: a
    // blocked viewer only ever sees canSend:false with viewerBlockedOther
    // false, the same shape a deactivated-account or DM-restriction case
    // would produce - see context/current-feature.md's ambiguity design.
    return res.status(200).json({
      message: "Fetched the messages successfully",
      ...page,
      otherParticipantLastReadAt,
      canSend: block === null,
      viewerBlockedOther: block !== null && block.blockerId === userId,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const markConversationReadController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const userId = req.userId as string;
    await markConversationRead({ convoId, userId });
    return res.status(200).json({ message: "Conversation marked as read" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};

export const getArchivedConversationsController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { cursor, search, limit } = req.query as unknown as ConversationsListQueryInput;
    const { conversations, nextCursor, hasMore } = await getArchivedConversations(userId, {
      cursor,
      search,
      limit,
    });
    return res.status(200).json({
      message: "Fetched the archived conversations",
      conversations,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const archiveConversationController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const userId = req.userId as string;
    await archiveConversation({ convoId, userId });
    return res.status(200).json({ message: "Conversation archived" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};

export const unarchiveConversationController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const userId = req.userId as string;
    await unarchiveConversation({ convoId, userId });
    return res.status(200).json({ message: "Conversation unarchived" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};

export const deleteConversationForMeController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const userId = req.userId as string;
    await deleteConversationForMe({ convoId, userId });
    return res.status(200).json({ message: "Conversation deleted" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};

export const getConvoMediaController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const type = req.query.type as "images" | "files";
    const before = req.query.before as string | undefined;
    const page =
      type === "files"
        ? await getConversationFilesPage(convoId, before)
        : await getConversationMediaPage(convoId, before);
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
    if (error instanceof MessageNotAllowedError) {
      return res.status(403).json(MESSAGE_NOT_ALLOWED_RESPONSE);
    }
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
    if (error instanceof MessageNotAllowedError) {
      return res.status(403).json(MESSAGE_NOT_ALLOWED_RESPONSE);
    }
    return res.status(400).json({ error });
  }
};

export const sendFilesMessageController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const authUserId = req.userId as string;
    const { messageText } = req.body;
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) throw new Error("No files provided");
    const message = await sendFilesMessage({ convoId, authUserId, messageText, files });

    return res.status(201).json(message);
  } catch (error) {
    if (error instanceof MessageNotAllowedError) {
      return res.status(403).json(MESSAGE_NOT_ALLOWED_RESPONSE);
    }
    return res.status(400).json({ error });
  }
};

export const sendVoiceMessageController = async (req: Request, res: Response) => {
  try {
    const convoId = req.params.id as string;
    const authUserId = req.userId as string;
    const { durationSec } = req.body;
    const audio = req.file as Express.Multer.File | undefined;
    if (!audio) throw new Error("No audio file provided");
    const message = await sendVoiceMessage({ convoId, authUserId, audio, durationSec });

    return res.status(201).json(message);
  } catch (error) {
    if (error instanceof MessageNotAllowedError) {
      return res.status(403).json(MESSAGE_NOT_ALLOWED_RESPONSE);
    }
    return res.status(400).json({ error });
  }
};

export const deleteMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id as string;
    await deleteMessage({ messageId });
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
    const { newContent } = req.body;
    await editMessage({ newContent, messageId });
    return res.status(200).json({ message: "Message edited successfully" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};

export const reactToMessageController = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id as string;
    const userId = req.userId as string;
    const { emoji } = req.body;
    const result = await setMessageReaction({ messageId, userId, emoji });
    return res.status(200).json(result);
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};
