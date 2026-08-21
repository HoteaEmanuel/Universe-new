import { prisma } from "../database/prisma.js";
import type { GroupRole } from "../generated/prisma/client.js";
import { runSerializable } from "../lib/serializableTransaction.js";

export class GroupBannedError extends Error {}

export const GROUP_BAN_USER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  name: true,
  profilePicture: true,
  university: true,
} as const;

interface CreateGroupMemberInput {
  groupId: string;
  userId: string;
  role?: GroupRole;
}

export const createGroupMember = async (memberData: CreateGroupMemberInput) => {
  const { groupId, userId, role } = memberData;
  return prisma.groupMembers.create({
    data: { groupId, memberId: userId, role },
  });
};

// The one write path that's allowed to create a GroupMembers row. Both
// addMemberToGroup's self-join and admin-add branches must go through this
// instead of createGroupMember directly, otherwise either path can re-admit
// a banned user (see the Codex design review in current-feature.md - the
// original spec checked the ban once, earlier in addMemberToGroup, which
// left a check-then-write race against a concurrent ban). Serializable so a
// concurrent ban can't race past the check.
export const acquireGroupMember = async (memberData: CreateGroupMemberInput) => {
  const { groupId, userId, role } = memberData;
  return runSerializable(async (tx) => {
    const ban = await tx.groupBan.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (ban) throw new GroupBannedError("You have been removed from this group");
    return tx.groupMembers.create({ data: { groupId, memberId: userId, role } });
  });
};

export const findGroupMembers = async (groupId: string) => {
  return prisma.groupMembers.findMany({ where: { groupId } });
};

export const findGroupMembersByUsernames = async (
  groupId: string,
  usernames: string[],
) => {
  if (usernames.length === 0) return [];
  const memberships = await prisma.groupMembers.findMany({
    where: {
      groupId,
      member: { username: { in: [...new Set(usernames)] } },
    },
    select: {
      member: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          name: true,
          profilePicture: true,
        },
      },
    },
  });
  return memberships.map((membership) => membership.member);
};

export const searchGroupMembersByUsername = async (
  groupId: string,
  query: string,
) => {
  const memberships = await prisma.groupMembers.findMany({
    where: { groupId, member: { username: { startsWith: query } } },
    select: {
      member: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          name: true,
          profilePicture: true,
        },
      },
    },
    take: 8,
  });
  return memberships
    .map((membership) => membership.member)
    .sort((a, b) => a.username.localeCompare(b.username));
};

export const findGroupMembershipsForUser = async (userId: string) => {
  return prisma.groupMembers.findMany({ where: { memberId: userId } });
};

export const findGroupMember = async (groupId: string, memberId: string) => {
  return prisma.groupMembers.findUnique({
    where: { groupId_memberId: { groupId, memberId } },
  });
};

export const findGroupBan = async (groupId: string, userId: string) => {
  return prisma.groupBan.findUnique({ where: { groupId_userId: { groupId, userId } } });
};

interface BanGroupMemberInput {
  groupId: string;
  userId: string;
  bannedByUserId: string;
  reason?: string;
}

// Kick + ban as one atomic action, mirroring banEventParticipant.
export const banGroupMember = async (data: BanGroupMemberInput) => {
  const { groupId, userId, bannedByUserId, reason } = data;
  return runSerializable(async (tx) => {
    await tx.groupMembers.deleteMany({ where: { groupId, memberId: userId } });
    return tx.groupBan.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId, bannedByUserId, reason },
      update: { bannedByUserId, reason, createdAt: new Date() },
    });
  });
};

export const deleteGroupBan = async (groupId: string, userId: string) => {
  return prisma.groupBan.deleteMany({ where: { groupId, userId } });
};

interface FindGroupBansInput {
  groupId: string;
  cursor?: string;
  limit: number;
}

export const findGroupBansPage = async ({ groupId, cursor, limit }: FindGroupBansInput) => {
  const rows = await prisma.groupBan.findMany({
    where: { groupId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      user: { select: GROUP_BAN_USER_SELECT },
      bannedBy: { select: GROUP_BAN_USER_SELECT },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return { items: page, nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null, hasMore };
};
