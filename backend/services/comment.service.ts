import { getActivePostUsers } from "../lib/socket.js";
import { findPostById } from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import {
  createNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import {
  createCommentTx,
  deleteCommentTx,
  findCommentById,
  likeCommentTx,
  removeCommentLikeTx,
} from "../repository/comment.repository.js";

export const createComment = async (data: {
  id: string;
  userId: string;
  commentText: string;
  parentId?: string;
}) => {
  const { id, userId, commentText, parentId } = data;
  const post = await findPostById(id);
  if (!post) throw new Error("The post doesnt exist");

  const parentComment = parentId ? await findCommentById(parentId) : null;

  const comment = await createCommentTx({
    postId: id,
    userId,
    text: commentText,
    parentId,
  });

  const activePostUsers = getActivePostUsers(id);
  const user = await findUserById(userId);
  const notifiedUserIds = new Set<string>();

  // Notify the parent comment's author directly when someone replies to them
  if (
    parentComment &&
    parentComment.userId !== userId &&
    !activePostUsers?.has(parentComment.userId)
  ) {
    const notification = await createNotification({
      actionUserId: userId,
      userId: parentComment.userId,
      title: "New reply",
      type: "post-reply",
      message: `${user?.firstName || user?.name} replied to your comment - ${commentText}!`,
    });
    await emitNewNotification(parentComment.userId, notification);
    notifiedUserIds.add(parentComment.userId);
  }

  // Notify the post owner about new activity on their post, unless they were
  // already notified above or are actively viewing the post
  if (
    post.userId !== userId &&
    !notifiedUserIds.has(post.userId) &&
    !activePostUsers?.has(post.userId)
  ) {
    const notification = await createNotification({
      actionUserId: userId,
      userId: post.userId,
      title: parentId ? "New reply" : "New comment",
      type: "post-comment",
      message: parentId
        ? `${user?.firstName || user?.name} replied to a comment on your post - ${commentText}!`
        : `${user?.firstName || user?.name} commented on your post - ${commentText}!`,
    });

    await emitNewNotification(post.userId, notification);
  }

  return comment;
};

export const likeComment = async (data: { commentId: string; userId: string }) => {
  const { commentId, userId } = data;
  const comment = await findCommentById(commentId);
  if (!comment) throw new Error("Comment not found");

  const like = await likeCommentTx(commentId, userId);

  if (comment.userId !== userId) {
    const user = await findUserById(userId);
    const notification = await createNotification({
      actionUserId: userId,
      userId: comment.userId,
      title: "New comment like",
      type: "comment-like",
      message: `${user?.firstName || user?.name} liked your comment!`,
    });
    await emitNewNotification(comment.userId, notification);
  }

  return like;
};

export const removeCommentLike = async (commentId: string, userId: string) => {
  await removeCommentLikeTx(commentId, userId);
};

export const deleteComment = async (commentId: string) => {
  await deleteCommentTx(commentId);
};
