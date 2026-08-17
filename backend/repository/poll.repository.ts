import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export const POLL_INCLUDE = {
  options: {
    orderBy: { position: "asc" },
    include: { _count: { select: { votes: true } } },
  },
} satisfies Prisma.PollInclude;

export const findPollById = async (id: string) => {
  return prisma.poll.findUnique({ where: { id }, include: POLL_INCLUDE });
};

export const findUserVoteForPoll = async (pollId: string, userId: string) => {
  return prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId } },
  });
};

export const castVote = async (data: {
  pollId: string;
  optionId: string;
  userId: string;
}) => {
  const { pollId, optionId, userId } = data;
  return prisma.pollVote.upsert({
    where: { pollId_userId: { pollId, userId } },
    update: { optionId },
    create: { pollId, optionId, userId },
  });
};

export const closePollRow = async (pollId: string) => {
  return prisma.poll.update({
    where: { id: pollId },
    data: { closedAt: new Date() },
  });
};
