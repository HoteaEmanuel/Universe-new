import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

const COMMENT_ORDER_BY: Prisma.CommentOrderByWithRelationInput[] = [
  { likesCount: "desc" },
  { createdAt: "desc" },
  { id: "desc" },
];

interface CommentPage<T> {
  comments: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const toCommentPage = <T extends { id: string }>(
  rows: T[],
  limit: number,
): CommentPage<T> => {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    comments: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    hasMore,
  };
};

export const getPostCommentsPage = async (
  postId: string,
  cursor?: string,
  limit = 20,
) => {
  const rows = await prisma.comment.findMany({
    where: { postId },
    orderBy: COMMENT_ORDER_BY,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return toCommentPage(rows, limit);
};

export const getLikedCommentIds = async (commentIds: string[], userId: string) => {
  if (commentIds.length === 0) return new Set<string>();
  const likes = await prisma.commentLike.findMany({
    where: { commentId: { in: commentIds }, likedById: userId },
    select: { commentId: true },
  });
  return new Set(likes.map((like) => like.commentId));
};

export const likeCommentTx = async (commentId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new Error("Comment not found");
    const like = await tx.commentLike.create({
      data: { commentId, likedById: userId },
    });
    await tx.comment.update({
      where: { id: commentId },
      data: { likesCount: { increment: 1 } },
    });
    return like;
  });
};

export const removeCommentLikeTx = async (commentId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.commentLike.deleteMany({
      where: { commentId, likedById: userId },
    });
    if (deleted.count === 0) throw new Error("Comment Like not found");
    await tx.comment.update({
      where: { id: commentId },
      data: { likesCount: { decrement: 1 } },
    });
  });
};
