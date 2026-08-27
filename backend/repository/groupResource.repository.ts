import { prisma } from "../database/prisma.js";
import type { Prisma, ResourceCategory } from "../generated/prisma/client.js";

export const RESOURCE_UPLOADER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  name: true,
  profilePicture: true,
} as const;

export const RESOURCE_INCLUDE = {
  uploader: { select: RESOURCE_UPLOADER_SELECT },
  _count: { select: { helpfulVotes: true } },
} as const;

interface CreateGroupResourceInput {
  groupId: string;
  uploaderId: string;
  title: string;
  description?: string;
  category: ResourceCategory;
  week?: string;
  linkUrl?: string;
  fileUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export const createGroupResource = async (data: CreateGroupResourceInput) => {
  return prisma.courseResource.create({
    data,
    include: RESOURCE_INCLUDE,
  });
};

export const findGroupResourceById = async (resourceId: string) => {
  return prisma.courseResource.findUnique({ where: { id: resourceId } });
};

interface FindGroupResourcesPageInput {
  groupId: string;
  cursor?: string;
  limit: number;
  category?: ResourceCategory;
  search?: string;
  week?: string;
}

export const findGroupResourcesPage = async ({
  groupId,
  cursor,
  limit,
  category,
  search,
  week,
}: FindGroupResourcesPageInput) => {
  const where: Prisma.CourseResourceWhereInput = {
    groupId,
    ...(category ? { category } : {}),
    ...(week ? { week } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.courseResource.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    include: RESOURCE_INCLUDE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    hasMore,
  };
};

interface UpdateGroupResourceInput {
  title?: string;
  description?: string;
  category?: ResourceCategory;
  week?: string;
}

export const updateGroupResource = async (
  resourceId: string,
  data: UpdateGroupResourceInput,
) => {
  return prisma.courseResource.update({
    where: { id: resourceId },
    data,
    include: RESOURCE_INCLUDE,
  });
};

export const deleteGroupResource = async (resourceId: string) => {
  return prisma.courseResource.delete({ where: { id: resourceId } });
};

export const setGroupResourcePinned = async (
  resourceId: string,
  pinned: boolean,
) => {
  return prisma.courseResource.update({
    where: { id: resourceId },
    data: { pinned },
    include: RESOURCE_INCLUDE,
  });
};

export const incrementResourceDownloadCount = async (resourceId: string) => {
  return prisma.courseResource.update({
    where: { id: resourceId },
    data: { downloadCount: { increment: 1 } },
  });
};

// Toggle semantics: create the vote if absent, remove it if present - same
// shape as toggling a Like. Returns whether the resource is now voted
// helpful by this user.
export const toggleResourceHelpfulVote = async (
  resourceId: string,
  userId: string,
) => {
  const existing = await prisma.resourceHelpfulVote.findUnique({
    where: { resourceId_userId: { resourceId, userId } },
  });
  if (existing) {
    await prisma.resourceHelpfulVote.delete({ where: { id: existing.id } });
    return { helpful: false };
  }
  await prisma.resourceHelpfulVote.create({ data: { resourceId, userId } });
  return { helpful: true };
};

export const findUserHelpfulVoteResourceIds = async (
  resourceIds: string[],
  userId: string,
) => {
  if (resourceIds.length === 0) return new Set<string>();
  const votes = await prisma.resourceHelpfulVote.findMany({
    where: { resourceId: { in: resourceIds }, userId },
    select: { resourceId: true },
  });
  return new Set(votes.map((vote) => vote.resourceId));
};
