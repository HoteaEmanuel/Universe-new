import type { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import {
  createComment,
  likeComment,
  removeCommentLike,
} from "../services/comment.service.js";
import {
  getLikedCommentIds,
  getPostCommentsPage,
} from "../repository/comment.repository.js";
import type { CommentQueryInput } from "../schemas/comment.schema.js";

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
    const commentsWithLikes = comments.map((comment) => ({
      ...comment,
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
    const { comment: commentText } = req.body;
    await createComment({ id, userId, commentText });
    return res.status(201).json({ message: "Succes" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.comment.deleteMany({ where: { id } });
    return res
      .status(200)
      .json({ message: "Deleted the comment successfully" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};
