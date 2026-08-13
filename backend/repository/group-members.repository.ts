import { prisma } from "../database/prisma.js";
import type { GroupRole } from "../generated/prisma/client.js";

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

export const findGroupMembers = async (groupId: string) => {
  return prisma.groupMembers.findMany({ where: { groupId } });
};

export const findGroupMembershipsForUser = async (userId: string) => {
  return prisma.groupMembers.findMany({ where: { memberId: userId } });
};

export const findGroupMember = async (groupId: string, memberId: string) => {
  return prisma.groupMembers.findUnique({
    where: { groupId_memberId: { groupId, memberId } },
  });
};
