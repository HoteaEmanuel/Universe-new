import { prisma } from "../database/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import { encodeCursor, decodeCursor } from "../lib/keysetCursor.js";
import { TRIGRAM_THRESHOLD } from "./search.repository.js";

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

export type ConversationScope = "active" | "archived";

interface FindConversationsPageInput {
  userId: string;
  scope: ConversationScope;
  search?: string;
  cursor?: string;
  limit: number;
}

interface ConversationPageRow {
  id: string;
  updatedAt: Date;
  myClearedAt: Date | null;
  otherUserId: string;
  otherUsername: string;
  otherFirstName: string | null;
  otherLastName: string | null;
  otherName: string | null;
  otherProfilePicture: string | null;
  otherUniversity: string | null;
  otherAccountType: string;
  lastMessageId: string | null;
  lastMessageContent: string | null;
  lastMessageImageUrls: string[] | null;
  lastMessageAudioUrl: string | null;
  lastMessageSharedPostId: string | null;
  lastMessageSenderId: string | null;
  lastMessageCreatedAt: Date | null;
  unreadCount: number;
}

// scope === "archived" mirrors getConversationListForUser's old in-JS
// `isHidden` check; "active" is its negation.
const hiddenClauseFor = (scope: ConversationScope) =>
  scope === "archived"
    ? Prisma.sql`b."myHiddenAt" IS NOT NULL AND (lm.id IS NULL OR lm."createdAt" <= b."myHiddenAt")`
    : Prisma.sql`b."myHiddenAt" IS NULL OR (lm.id IS NOT NULL AND lm."createdAt" > b."myHiddenAt")`;

const toConversationRow = (row: ConversationPageRow) => {
  const previewIsCleared =
    row.myClearedAt !== null &&
    (!row.lastMessageId || (row.lastMessageCreatedAt as Date) <= row.myClearedAt);

  const lastMessage =
    row.lastMessageId && !previewIsCleared
      ? {
          content: row.lastMessageContent,
          imageUrls: row.lastMessageImageUrls ?? [],
          audioUrl: row.lastMessageAudioUrl,
          sharedPostId: row.lastMessageSharedPostId,
          senderId: row.lastMessageSenderId,
        }
      : null;

  return {
    id: row.id,
    updatedAt: row.updatedAt,
    unreadCount: row.unreadCount,
    user: {
      id: row.otherUserId,
      username: row.otherUsername,
      firstName: row.otherFirstName,
      lastName: row.otherLastName,
      name: row.otherName,
      profilePicture: row.otherProfilePicture,
      university: row.otherUniversity,
      accountType: row.otherAccountType,
    },
    lastMessage,
  };
};

// Same searchVector + trigram-fallback shape as searchUsers in
// search.repository.ts, scoped to the other participant's row so it stays
// consistent with how the rest of the app searches people.
export const findConversationsPage = async ({
  userId,
  scope,
  search,
  cursor,
  limit,
}: FindConversationsPageInput) => {
  const searchClause = search
    ? Prisma.sql`AND (
        ou."searchVector" @@ websearch_to_tsquery('simple', ${search})
        OR similarity(coalesce(ou.name, '') || ' ' || coalesce(ou."firstName", '') || ' ' || coalesce(ou."lastName", ''), ${search}) > ${TRIGRAM_THRESHOLD}
      )`
    : Prisma.empty;

  const cursorClause = cursor
    ? (() => {
        const decoded = decodeCursor(cursor);
        return Prisma.sql`AND (b."updatedAt", b.id) < (${decoded.updatedAt}, ${decoded.id})`;
      })()
    : Prisma.empty;

  const rows = await prisma.$queryRaw<ConversationPageRow[]>`
    WITH base AS (
      SELECT
        c.id,
        c."updatedAt",
        CASE WHEN c."participantOneId" = ${userId} THEN c."participantTwoId" ELSE c."participantOneId" END AS "otherUserId",
        CASE WHEN c."participantOneId" = ${userId} THEN c."lastReadAtParticipantOne" ELSE c."lastReadAtParticipantTwo" END AS "myLastReadAt",
        CASE WHEN c."participantOneId" = ${userId} THEN c."clearedAtParticipantOne" ELSE c."clearedAtParticipantTwo" END AS "myClearedAt",
        CASE WHEN c."participantOneId" = ${userId} THEN c."hiddenAtParticipantOne" ELSE c."hiddenAtParticipantTwo" END AS "myHiddenAt",
        c."lastMessageId"
      FROM conversations c
      WHERE c."participantOneId" = ${userId} OR c."participantTwoId" = ${userId}
    )
    SELECT
      b.id,
      b."updatedAt",
      b."myClearedAt",
      ou.id AS "otherUserId",
      ou.username AS "otherUsername",
      ou."firstName" AS "otherFirstName",
      ou."lastName" AS "otherLastName",
      ou.name AS "otherName",
      ou."profilePicture" AS "otherProfilePicture",
      ou.university AS "otherUniversity",
      ou."accountType" AS "otherAccountType",
      lm.id AS "lastMessageId",
      lm.content AS "lastMessageContent",
      lm."imageUrls" AS "lastMessageImageUrls",
      lm."audioUrl" AS "lastMessageAudioUrl",
      lm."sharedPostId" AS "lastMessageSharedPostId",
      lm."senderId" AS "lastMessageSenderId",
      lm."createdAt" AS "lastMessageCreatedAt",
      (
        SELECT count(*)::int FROM messages m
        WHERE m."conversationId" = b.id
          AND m."senderId" <> ${userId}
          AND m.deleted = false
          AND m."createdAt" > GREATEST(
            coalesce(b."myLastReadAt", '-infinity'::timestamp),
            coalesce(b."myClearedAt", '-infinity'::timestamp)
          )
      ) AS "unreadCount"
    FROM base b
    JOIN users ou ON ou.id = b."otherUserId"
    LEFT JOIN messages lm ON lm.id = b."lastMessageId"
    WHERE (${hiddenClauseFor(scope)})
    ${searchClause}
    ${cursorClause}
    ORDER BY b."updatedAt" DESC, b.id DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  return {
    conversations: page.map(toConversationRow),
    nextCursor: hasMore && last ? encodeCursor(last.updatedAt, last.id) : null,
    hasMore,
  };
};
