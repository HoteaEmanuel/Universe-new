import { getActivePostUsers, getReceiverSocketId, io } from "../lib/socket.js";
import { prisma } from "../database/prisma.js";
import { findPostById } from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { createNotification } from "../repository/notification.repository.js";
import { likeCommentTx, removeCommentLikeTx } from "../repository/comment.repository.js";

export const createComment = async (data: {
  id: string;
  userId: string;
  commentText: string;
}) => {
  const { id, userId, commentText } = data;
  const post = await findPostById(id);
  if (!post) throw new Error("The post doesnt exist");
  const comment = await prisma.comment.create({
    data: { postId: id, userId, text: commentText },
  });

  const activePostUsers = getActivePostUsers(id);

  // If the user that created the post is not on the post => send notification
  if (!activePostUsers?.has(post.userId)) {
    const user = await findUserById(userId);
    const notification = await createNotification({
      actionUserId: userId,
      userId: post.userId,
      title: "New comment",
      type: "post-comment",
      message: `${user?.firstName || user?.name} commented on your post - ${commentText}!`,
    });

    io.to(getReceiverSocketId(post.userId)).emit("newNotification", notification);
  }

  return comment;
};

export const likeComment = async (data: { commentId: string; userId: string }) => {
  const { commentId, userId } = data;
  return likeCommentTx(commentId, userId);
};

export const removeCommentLike = async (commentId: string, userId: string) => {
  await removeCommentLikeTx(commentId, userId);
};
