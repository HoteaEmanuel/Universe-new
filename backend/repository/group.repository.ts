import { prisma } from "../database/prisma.js";
import type { GroupVisibility } from "../generated/prisma/client.js";

interface CreateGroupInput {
  name: string;
  description?: string;
  visibility?: GroupVisibility;
}

export const createGroup = async (data: CreateGroupInput) => {
  const { name, description, visibility } = data;
  return prisma.group.create({ data: { name, description, visibility } });
};

export const findGroupById = async (groupId: string) => {
  return prisma.group.findUnique({ where: { id: groupId } });
};

export const findPublicGroupsNotJoined = async (excludedGroupIds: string[]) => {
  return prisma.group.findMany({
    where: { visibility: "public", id: { notIn: excludedGroupIds } },
    orderBy: { createdAt: "desc" },
  });
};
