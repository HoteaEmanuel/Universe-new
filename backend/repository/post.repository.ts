import { prisma } from "../database/prisma.js";

export const findPostById = async (id: string) => {
  return prisma.post.findUnique({ where: { id } });
};

export const findAllPosts = async () => {
  return prisma.post.findMany({ orderBy: { createdAt: "desc" } });
};

export const findUserPosts = async (userId: string) => {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const findUserSavedPosts = async (userId: string) => {
  return prisma.savedPost.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
    include: { post: true },
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
  });
};

export const findPostsByTag = async (tag: string) => {
  return prisma.post.findMany({
    where: { tags: { some: { name: tag } } },
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
