import { prisma } from "../database/prisma.js";
import type { GroupVisibility } from "../generated/prisma/client.js";

interface CreateGroupInput {
  name: string;
  description?: string;
  visibility?: GroupVisibility;
  university?: string | null;
  courseTag?: string | null;
}

export const createGroup = async (data: CreateGroupInput) => {
  const { name, description, visibility, university, courseTag } = data;
  return prisma.group.create({
    data: { name, description, visibility, university, courseTag },
  });
};

export const findGroupById = async (groupId: string) => {
  return prisma.group.findUnique({ where: { id: groupId } });
};

export const findPublicGroupsNotJoined = async (
  excludedGroupIds: string[],
  courseTag?: string,
) => {
  return prisma.group.findMany({
    where: {
      visibility: "public",
      id: { notIn: excludedGroupIds },
      ...(courseTag ? { courseTag } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
};

export const setGroupCourseTag = async (groupId: string, courseTag: string | null) => {
  return prisma.group.update({ where: { id: groupId }, data: { courseTag } });
};
