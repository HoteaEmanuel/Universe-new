import { prisma } from "../database/prisma.js";
import {
  findPollById,
  findUserVoteForPoll,
  castVote,
  closePollRow,
} from "../repository/poll.repository.js";
import { findGroupMember } from "../repository/group-members.repository.js";
import type { PollStatus } from "../types/shared.js";

type PollWithRelations = NonNullable<Awaited<ReturnType<typeof findPollById>>>;

export const derivePollStatus = (poll: {
  closedAt: Date | null;
  closesAt: Date | null;
}): PollStatus => {
  if (poll.closedAt) return "closed";
  if (poll.closesAt && poll.closesAt.getTime() <= Date.now()) return "closed";
  return "open";
};

export const toPollDTO = (poll: PollWithRelations) => {
  const totalVotes = poll.options.reduce(
    (sum, option) => sum + option._count.votes,
    0,
  );
  return {
    id: poll.id,
    question: poll.question,
    authorId: poll.authorId,
    closesAt: poll.closesAt,
    closedAt: poll.closedAt,
    status: derivePollStatus(poll),
    totalVotes,
    options: poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      position: option.position,
      voteCount: option._count.votes,
    })),
  };
};

export const voteOnPoll = async (data: {
  pollId: string;
  userId: string;
  optionId: string;
}) => {
  const { pollId, userId, optionId } = data;
  const poll = await findPollById(pollId);
  if (!poll) throw new Error("Poll not found");
  if (derivePollStatus(poll) === "closed") throw new Error("This poll is closed");
  if (!poll.options.some((option) => option.id === optionId)) {
    throw new Error("Invalid poll option");
  }

  if (poll.groupMessageId) {
    const groupMessage = await prisma.groupMessage.findUnique({
      where: { id: poll.groupMessageId },
      select: { groupId: true },
    });
    const isMember =
      groupMessage && (await findGroupMember(groupMessage.groupId, userId));
    if (!isMember) throw new Error("You must be a member of this group to vote");
  }

  await castVote({ pollId, optionId, userId });
  const updated = await findPollById(pollId);
  return toPollDTO(updated as PollWithRelations);
};

export const closePoll = async (data: { pollId: string; userId: string }) => {
  const { pollId, userId } = data;
  const poll = await findPollById(pollId);
  if (!poll) throw new Error("Poll not found");
  if (poll.authorId !== userId) throw new Error("Only the poll author can close it");
  if (poll.closedAt) throw new Error("Poll is already closed");

  await closePollRow(pollId);
  const updated = await findPollById(pollId);
  return toPollDTO(updated as PollWithRelations);
};

export const getMyPollVote = async (pollId: string, userId: string) => {
  const vote = await findUserVoteForPoll(pollId, userId);
  return vote?.optionId ?? null;
};
