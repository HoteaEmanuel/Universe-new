import { prisma } from "../database/prisma.js";

const PARTICIPANT_OMIT = {
  password: true,
  resetPasswordToken: true,
  resetPasswordExpiresAt: true,
  refreshToken: true,
  verificationCode: true,
  verificationCodeExpiresAt: true,
  isVerified: true,
  identityVerified: true,
  role: true,
  email: true,
  lastLogin: true,
  bio: true,
  major: true,
  university: true,
} as const;

export const findConversationByParticipants = async (
  authUserId: string,
  otherUserId: string,
) => {
  return prisma.conversation.findFirst({
    where: {
      OR: [
        { participantOneId: authUserId, participantTwoId: otherUserId },
        { participantOneId: otherUserId, participantTwoId: authUserId },
      ],
    },
  });
};

export const createConversation = async (data: {
  authUserId: string;
  otherUserId: string;
}) => {
  const { authUserId, otherUserId } = data;
  const [participantOneId, participantTwoId] = [authUserId, otherUserId].sort();

  return prisma.conversation.create({
    data: { participantOneId, participantTwoId },
  });
};

export const findConversationById = async (id: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participantOne: { omit: PARTICIPANT_OMIT },
      participantTwo: { omit: PARTICIPANT_OMIT },
    },
  });
  if (!conversation) return null;
  return {
    ...conversation,
    participants: [conversation.participantOne, conversation.participantTwo],
  };
};

export const markConversationRead = async (conversationId: string, userId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { participantOneId: true, participantTwoId: true },
  });
  if (!conversation) return null;
  const field =
    conversation.participantOneId === userId
      ? "lastReadAtParticipantOne"
      : "lastReadAtParticipantTwo";
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { [field]: new Date() },
  });
};

export const findConversationReadCursors = async (conversationId: string) => {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      participantOneId: true,
      participantTwoId: true,
      lastReadAtParticipantOne: true,
      lastReadAtParticipantTwo: true,
    },
  });
};

export const findConversationArchiveState = async (conversationId: string) => {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      participantOneId: true,
      participantTwoId: true,
      clearedAtParticipantOne: true,
      clearedAtParticipantTwo: true,
      hiddenAtParticipantOne: true,
      hiddenAtParticipantTwo: true,
    },
  });
};

export const setConversationHiddenAt = async (
  conversationId: string,
  userId: string,
  hiddenAt: Date | null,
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { participantOneId: true, participantTwoId: true },
  });
  if (!conversation) return null;
  const field =
    conversation.participantOneId === userId
      ? "hiddenAtParticipantOne"
      : "hiddenAtParticipantTwo";
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { [field]: hiddenAt },
  });
};

export const setConversationClearedAndHiddenAt = async (
  conversationId: string,
  userId: string,
  at: Date,
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { participantOneId: true, participantTwoId: true },
  });
  if (!conversation) return null;
  const isParticipantOne = conversation.participantOneId === userId;
  return prisma.conversation.update({
    where: { id: conversationId },
    data: isParticipantOne
      ? { clearedAtParticipantOne: at, hiddenAtParticipantOne: at }
      : { clearedAtParticipantTwo: at, hiddenAtParticipantTwo: at },
  });
};

export const findAllConversationsByParticipant = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ participantOneId: userId }, { participantTwoId: userId }] },
    include: {
      participantOne: { omit: PARTICIPANT_OMIT },
      participantTwo: { omit: PARTICIPANT_OMIT },
      lastMessage: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  return conversations.map((conversation) => ({
    ...conversation,
    participants: [conversation.participantOne, conversation.participantTwo],
  }));
};
