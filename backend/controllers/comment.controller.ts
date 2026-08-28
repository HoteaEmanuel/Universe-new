import type { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import {
  createComment,
  deleteComment as deleteCommentService,
  likeComment,
  removeCommentLike,
} from "../services/comment.service.js";
import {
  getCommentRepliesPage,
  getLikedCommentIds,
  getPostCommentsPage,
} from "../repository/comment.repository.js";
import type { CommentQueryInput } from "../schemas/comment.schema.js";

const TOMBSTONE_TEXT = "This comment is unavailable.";
const REMOVED_TEXT = "This comment was removed for violating community guidelines.";

// Blocked-author comments are kept in the list (not filtered out) so replies
// nested under them stay reachable, but their identity/content is hidden.
const withBlockAwareness = <
  T extends { userId: string; text: string; mentionedUsers: unknown[] },
>(
  comment: T,
  blockedIds: Set<string>,
) => {
  if (!blockedIds.has(comment.userId)) {
    return { ...comment, isBlocked: false };
  }
  return {
    ...comment,
    userId: null,
    text: TOMBSTONE_TEXT,
    mentionedUsers: [],
    isBlocked: true,
  };
};

// Same tombstone approach as withBlockAwareness, for the same reason: a
// moderator-removed comment's replies still need to stay reachable.
const withRemovalAwareness = <
  T extends { text: string; mentionedUsers: unknown[]; removedAt?: Date | null },
>(
  comment: T,
) => {
  if (!comment.removedAt) {
    return { ...comment, isRemoved: false };
  }
  return {
    ...comment,
    text: REMOVED_TEXT,
    mentionedUsers: [],
    isRemoved: true,
  };
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const { cursor, limit } = req.query as unknown as CommentQueryInput;
    const { comments, nextCursor, hasMore } = await getPostCommentsPage(
      postId,
      cursor,
      limit,
    );
    const likedCommentIds = await getLikedCommentIds(
      comments.map((comment) => comment.id),
      req.userId as string,
    );
    const blockedIds = req.blockedIds ?? new Set<string>();
    const commentsWithLikes = comments.map((comment) => ({
      ...withRemovalAwareness(withBlockAwareness(comment, blockedIds)),
      isLiked: likedCommentIds.has(comment.id),
    }));
    return res.status(200).json({
      message: "Success",
      comments: commentsWithLikes,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getCommentReplies = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id as string;
    const parentId = req.params.commentId as string;
    const { cursor, limit } = req.query as unknown as CommentQueryInput;
    const { comments, nextCursor, hasMore } = await getCommentRepliesPage(
      postId,
      parentId,
      cursor,
      limit,
    );
    const likedCommentIds = await getLikedCommentIds(
      comments.map((comment) => comment.id),
      req.userId as string,
    );
    const blockedIds = req.blockedIds ?? new Set<string>();
    const commentsWithLikes = comments.map((comment) => ({
      ...withRemovalAwareness(withBlockAwareness(comment, blockedIds)),
      isLiked: likedCommentIds.has(comment.id),
    }));
    return res.status(200).json({
      message: "Success",
      comments: commentsWithLikes,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const likeCommentController = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id as string;
    await likeComment({ commentId, userId: req.userId as string });
    return res.status(200).json({ message: "Comment liked successfully" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const removeLikeCommentController = async (req: Request, res: Response) => {
  try {
    const commentId = req.params.id as string;
    const userId = req.userId as string;
    await removeCommentLike(commentId, userId);
    return res
      .status(200)
      .json({ message: "Comment like removed successfully" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getCommentsCount = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const commentsCount = await prisma.comment.count({ where: { postId: id } });
    return res.status(200).json({ message: "Success", commentsCount });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const sendCommentController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId as string;
    const { comment: commentText, parentId } = req.body;
    await createComment({ id, userId, commentText, parentId });
    return res.status(201).json({ message: "Succes" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await deleteCommentService(id);
    return res
      .status(200)
      .json({ message: "Deleted the comment successfully" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};
