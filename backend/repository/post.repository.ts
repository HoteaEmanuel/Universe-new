import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import { EVENT_INCLUDE } from "./event.repository.js";
import { POLL_INCLUDE } from "./poll.repository.js";

const POST_INCLUDE = {
  event: { include: EVENT_INCLUDE },
  poll: { include: POLL_INCLUDE },
  tags: { select: { name: true } },
  mentionedUsers: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      name: true,
      profilePicture: true,
    },
  },
} satisfies Prisma.PostInclude;

export { POST_INCLUDE };

export const findPostById = async (id: string) => {
  return prisma.post.findUnique({ where: { id }, include: POST_INCLUDE });
};

const FEED_ORDER_BY: Prisma.PostOrderByWithRelationInput[] = [
  { createdAt: "desc" },
  { id: "desc" },
];

interface FeedPage<T> {
  posts: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const toFeedPage = <T extends { id: string }>(
  posts: T[],
  limit: number,
): FeedPage<T> => {
  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  return {
    posts: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    hasMore,
  };
};

export const findAllPosts = async (
  cursor?: string,
  limit = 10,
  excludeUserIds: string[] = [],
) => {
  const posts = await prisma.post.findMany({
    where: excludeUserIds.length ? { userId: { notIn: excludeUserIds } } : undefined,
    take: limit + 1,
    orderBy: FEED_ORDER_BY,
    include: POST_INCLUDE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toFeedPage(posts, limit);
};

export const findFollowingPosts = async (
  followingIds: string[],
  cursor?: string,
  limit = 10,
  excludeUserIds: string[] = [],
) => {
  const posts = await prisma.post.findMany({
    where: {
      userId: { in: followingIds, ...(excludeUserIds.length ? { notIn: excludeUserIds } : {}) },
    },
    take: limit + 1,
    orderBy: FEED_ORDER_BY,
    include: POST_INCLUDE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toFeedPage(posts, limit);
};

export const findUniversityPosts = async (
  university: string | null,
  cursor?: string,
  limit = 10,
  excludeUserIds: string[] = [],
) => {
  const posts = await prisma.post.findMany({
    where: {
      user: { university },
      ...(excludeUserIds.length ? { userId: { notIn: excludeUserIds } } : {}),
    },
    take: limit + 1,
    orderBy: FEED_ORDER_BY,
    include: POST_INCLUDE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toFeedPage(posts, limit);
};

export const findUserPosts = async (userId: string) => {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: POST_INCLUDE,
  });
};

export const findUserSavedPosts = async (userId: string) => {
  return prisma.savedPost.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
    include: { post: { include: POST_INCLUDE } },
  });
};

interface CreatePostInput {
  userId: string;
  body?: string;
  title: string;
  tags?: string[];
  location?: string;
  imageUrls?: string[];
  imagePublicIds?: string[];
  mentionedUserIds?: string[];
  poll?: { question: string; options: string[]; closesAt?: Date };
  type?: "standard" | "opportunity";
  opportunityType?: "internship" | "part_time" | "full_time" | "graduate_program" | "volunteering" | "campus_ambassador";
  workplaceType?: "onsite" | "hybrid" | "remote";
  companyName?: string;
  applyUrl?: string;
  deadlineAt?: Date;
  expiresAt?: Date;
}

export const createPost = async (data: CreatePostInput) => {
  const {
    userId,
    body,
    title,
    tags,
    location,
    imageUrls,
    imagePublicIds,
    mentionedUserIds,
    poll,
    type,
    opportunityType,
    workplaceType,
    companyName,
    applyUrl,
    deadlineAt,
    expiresAt,
  } = data;

  return prisma.post.create({
    data: {
      userId,
      body,
      title,
      location,
      type,
      opportunityType,
      workplaceType,
      companyName,
      applyUrl,
      deadlineAt,
      expiresAt: expiresAt ?? deadlineAt,
      imagesUrls: imageUrls ?? [],
      imagesPublicIds: imagePublicIds ?? [],
      tags: tags?.length
        ? {
            connectOrCreate: tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          }
        : undefined,
      mentionedUsers: mentionedUserIds?.length
        ? { connect: mentionedUserIds.map((id) => ({ id })) }
        : undefined,
      poll: poll
        ? {
            create: {
              authorId: userId,
              question: poll.question,
              closesAt: poll.closesAt ?? null,
              options: {
                create: poll.options.map((text, position) => ({
                  text,
                  position,
                })),
              },
            },
          }
        : undefined,
    },
  });
};

export interface OpportunityFilters {
  cursor?: string;
  limit: number;
  q?: string;
  opportunityType?: "internship" | "part_time" | "full_time" | "graduate_program" | "volunteering" | "campus_ambassador";
  workplaceType?: "onsite" | "hybrid" | "remote";
  location?: string;
  status: "active" | "expired" | "all";
  sort: "newest" | "deadline";
  savedOnly?: boolean;
  viewerId: string;
  excludeUserIds?: string[];
}

export const findOpportunities = async (filters: OpportunityFilters) => {
  const now = new Date();
  const expiryFields: Prisma.PostWhereInput[] = [
    { opportunityClosedAt: { not: null } },
    { expiresAt: { lt: now } },
    { AND: [{ expiresAt: null }, { deadlineAt: { lt: now } }] },
  ];
  const where: Prisma.PostWhereInput = {
    type: "opportunity",
    ...(filters.excludeUserIds?.length ? { userId: { notIn: filters.excludeUserIds } } : {}),
    ...(filters.opportunityType ? { opportunityType: filters.opportunityType } : {}),
    ...(filters.workplaceType ? { workplaceType: filters.workplaceType } : {}),
    ...(filters.location ? { location: { contains: filters.location, mode: "insensitive" } } : {}),
    ...(filters.q ? {
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        { body: { contains: filters.q, mode: "insensitive" } },
        { companyName: { contains: filters.q, mode: "insensitive" } },
        { tags: { some: { name: { contains: filters.q, mode: "insensitive" } } } },
      ],
    } : {}),
    ...(filters.savedOnly ? { savedBy: { some: { userId: filters.viewerId } } } : {}),
    ...(filters.status === "active" ? { NOT: { OR: expiryFields } } : {}),
    ...(filters.status === "expired" ? { OR: expiryFields } : {}),
  };
  const posts = await prisma.post.findMany({
    where,
    take: filters.limit + 1,
    orderBy: filters.sort === "deadline"
      ? [{ deadlineAt: { sort: "asc", nulls: "last" } }, { id: "desc" }]
      : FEED_ORDER_BY,
    include: POST_INCLUDE,
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
  });
  return toFeedPage(posts, filters.limit);
};

export const setOpportunityClosed = async (postId: string, closed: boolean) =>
  prisma.post.update({
    where: { id: postId },
    data: { opportunityClosedAt: closed ? new Date() : null },
    include: POST_INCLUDE,
  });

export const findPostsByText = async (text: string) => {
  return prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: text, mode: "insensitive" } },
        { body: { contains: text, mode: "insensitive" } },
      ],
    },
    include: POST_INCLUDE,
  });
};

export const findPostsByTag = async (tag: string) => {
  return prisma.post.findMany({
    where: { tags: { some: { name: tag } } },
    include: POST_INCLUDE,
  });
};

export const findSavedPostByIds = async (userId: string, postId: string) => {
  return prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });
};

export const createSavedPost = async (userId: string, postId: string) => {
  return prisma.savedPost.create({ data: { userId, postId } });
};
