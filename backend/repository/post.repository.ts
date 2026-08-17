import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import { EVENT_INCLUDE } from "./event.repository.js";

const POST_INCLUDE = {
  event: { include: EVENT_INCLUDE },
} satisfies Prisma.PostInclude;

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

export const findAllPosts = async (cursor?: string, limit = 10) => {
  const posts = await prisma.post.findMany({
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
) => {
  const posts = await prisma.post.findMany({
    where: { userId: { in: followingIds } },
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
) => {
  const posts = await prisma.post.findMany({
    where: { user: { university } },
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
}

export const createPost = async (data: CreatePostInput) => {
  const { userId, body, title, tags, location, imageUrls, imagePublicIds } =
    data;

  return prisma.post.create({
    data: {
      userId,
      body,
      title,
      location,
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
    },
  });
};

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
