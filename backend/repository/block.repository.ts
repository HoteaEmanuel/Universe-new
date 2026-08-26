import { prisma } from "../database/prisma.js";

const BLOCKED_USER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  name: true,
  profilePicture: true,
} as const;

export const findBlock = async (blockerId: string, blockedId: string) => {
  return prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });
};

export const findBlockEitherDirection = async (userIdA: string, userIdB: string) => {
  return prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userIdA, blockedId: userIdB },
        { blockerId: userIdB, blockedId: userIdA },
      ],
    },
  });
};

export const createBlock = async (blockerId: string, blockedId: string) => {
  return prisma.block.create({ data: { blockerId, blockedId } });
};

export const deleteBlock = async (blockerId: string, blockedId: string) => {
  await prisma.block.deleteMany({ where: { blockerId, blockedId } });
};

export const findBlockedUsersForBlocker = async (blockerId: string) => {
  const blocks = await prisma.block.findMany({
    where: { blockerId },
    include: { blocked: { select: BLOCKED_USER_SELECT } },
    orderBy: { createdAt: "desc" },
  });
  return blocks.map((block) => ({
    id: block.id,
    createdAt: block.createdAt,
    user: block.blocked,
  }));
};
