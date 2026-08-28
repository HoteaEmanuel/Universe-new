import { prisma } from "../database/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

const COMMENT_INCLUDE = {
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
} satisfies Prisma.CommentInclude;

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
    where: { postId, parentId: null },
    orderBy: COMMENT_ORDER_BY,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: COMMENT_INCLUDE,
  });
  return toCommentPage(rows, limit);
};

export const getCommentRepliesPage = async (
  postId: string,
  parentId: string,
  cursor?: string,
  limit = 20,
) => {
  const parent = await prisma.comment.findFirst({
    where: { id: parentId, postId, parentId: null },
    select: { id: true },
  });
  if (!parent) throw new Error("Comment not found");

  const rows = await prisma.comment.findMany({
    where: { parentId },
    orderBy: COMMENT_ORDER_BY,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: COMMENT_INCLUDE,
  });
  return toCommentPage(rows, limit);
};

export const findCommentById = async (commentId: string) => {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, userId: true, postId: true, parentId: true },
  });
};

export const findCommentForReport = async (commentId: string) => {
  return prisma.comment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      text: true,
      userId: true,
      postId: true,
      user: { select: { username: true } },
    },
  });
};

interface SoftDeleteCommentInput {
  commentId: string;
  reason?: string;
  byUserId: string;
}

export const softDeleteComment = async (data: SoftDeleteCommentInput) => {
  return prisma.comment.update({
    where: { id: data.commentId },
    data: {
      removedAt: new Date(),
      removedReason: data.reason,
      removedByUserId: data.byUserId,
    },
  });
};

export const getLikedCommentIds = async (commentIds: string[], userId: string) => {
  if (commentIds.length === 0) return new Set<string>();
  const likes = await prisma.commentLike.findMany({
    where: { commentId: { in: commentIds }, likedById: userId },
    select: { commentId: true },
  });
  return new Set(likes.map((like) => like.commentId));
};

export const createCommentTx = async (data: {
  postId: string;
  userId: string;
  text: string;
  parentId?: string;
  mentionedUserIds?: string[];
}) => {
  const { postId, userId, text, parentId, mentionedUserIds } = data;
  return prisma.$transaction(async (tx) => {
    if (parentId) {
      const parent = await tx.comment.findUnique({ where: { id: parentId } });
      if (!parent) throw new Error("Parent comment not found");
      if (parent.postId !== postId) {
        throw new Error("Parent comment does not belong to this post");
      }
      if (parent.parentId) throw new Error("Cannot reply to a reply");
    }

    const comment = await tx.comment.create({
      data: {
        postId,
        userId,
        text,
        parentId: parentId ?? null,
        mentionedUsers: mentionedUserIds?.length
          ? { connect: mentionedUserIds.map((id) => ({ id })) }
          : undefined,
      },
    });

    if (parentId) {
      await tx.comment.update({
        where: { id: parentId },
        data: { repliesCount: { increment: 1 } },
      });
    }

    return comment;
  });
};

export const deleteCommentTx = async (commentId: string) => {
  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.findUnique({
      where: { id: commentId },
      select: { parentId: true },
    });
    const deleted = await tx.comment.deleteMany({ where: { id: commentId } });
    if (deleted.count > 0 && comment?.parentId) {
      await tx.comment.update({
        where: { id: comment.parentId },
        data: { repliesCount: { decrement: 1 } },
      });
    }
  });
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
