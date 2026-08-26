import {
  createBlock,
  deleteBlock,
  findBlock,
  findBlockEitherDirection,
  findBlockedUsersForBlocker,
} from "../repository/block.repository.js";
import {
  findConversationByParticipants,
  setConversationHiddenAt,
} from "../repository/conversation.repository.js";

// Ambigous message: the blocked user doesnt receive any information regarding if it was blocked
export class MessageNotAllowedError extends Error {}

export const isBlockedEitherWay = async (userIdA: string, userIdB: string) => {
  const block = await findBlockEitherDirection(userIdA, userIdB);
  return block !== null;
};

export const assertCanMessage = async (userIdA: string, userIdB: string) => {
  if (await isBlockedEitherWay(userIdA, userIdB)) {
    throw new MessageNotAllowedError();
  }
};

export const blockUser = async (data: {
  authUserId: string;
  targetUserId: string;
}) => {
  const { authUserId, targetUserId } = data;
  if (authUserId === targetUserId) throw new Error("You cannot block yourself");

  const existing = await findBlock(authUserId, targetUserId);
  if (!existing) {
    await createBlock(authUserId, targetUserId);
  }

  const conversation = await findConversationByParticipants(
    authUserId,
    targetUserId,
  );
  if (conversation) {
    await setConversationHiddenAt(conversation.id, authUserId, new Date());
  }
};

export const unblockUser = async (data: {
  authUserId: string;
  targetUserId: string;
}) => {
  const { authUserId, targetUserId } = data;
  await deleteBlock(authUserId, targetUserId);

  const conversation = await findConversationByParticipants(
    authUserId,
    targetUserId,
  );
  if (conversation) {
    await setConversationHiddenAt(conversation.id, authUserId, null);
  }
};

export const getBlockedUsers = async (authUserId: string) => {
  return findBlockedUsersForBlocker(authUserId);
};
