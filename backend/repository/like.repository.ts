import { prisma } from "../database/prisma.js";

export const findLikeByPostAndUser = async (postId: string, userId: string) => {
  return prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
};

export const createLike = async (postId: string, userId: string) => {
  return prisma.like.create({ data: { userId, postId } });
};

export const deleteLike = async (postId: string, userId: string) => {
  await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
};

export const deleteLikes = async (postId: string) => {
  await prisma.like.deleteMany({ where: { postId } });
};
