import {
  createFollow,
  deleteFollow,
  findFollow,
} from "../repository/follow.repository.js";
import {
  createSavedPost,
  findPostById,
  findSavedPostByIds,
} from "../repository/post.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { createNotification } from "../repository/notification.repository.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const savePost = async (data: { postId: string; authUserId: string }) => {
  const { postId, authUserId } = data;
  const post = await findPostById(postId);
  if (!post) throw new Error("Post not found");

  const user = await findUserById(authUserId);
  if (!user) throw new Error("User not found");
  if (post.userId === authUserId) {
    throw new Error("Saving works only for other users posts");
  }
  const alreadySaved = await findSavedPostByIds(authUserId, postId);
  if (alreadySaved) {
    throw new Error("Already saved");
  }
  return createSavedPost(authUserId, postId);
};

export const follow = async (data: { authUserId: string; followerId: string }) => {
  const { authUserId, followerId } = data;
  if (!authUserId || !followerId) throw new Error("Empty data");

  const user = await findUserById(authUserId);
  const toFollowUser = await findUserById(followerId);
  if (!user || !toFollowUser) throw new Error("User not found");

  const alreadyFollowing = await findFollow({ authUserId, followerId });
  if (alreadyFollowing) {
    throw new Error("Already following");
  }
  await createFollow({ authUserId, followerId });
  const notification = await createNotification({
    title: "New follow",
    message: `${user.firstName} started following you!`,
    userId: followerId,
    actionUserId: authUserId,
    type: "follow",
  });
  io.to(getReceiverSocketId(followerId)).emit("newNotification", notification);
};

export const unfollow = async (data: {
  authUserId: string;
  unfollowerId: string;
}) => {
  const { authUserId, unfollowerId } = data;
  const user = await findUserById(authUserId);
  const unfollowUser = await findUserById(unfollowerId);
  if (!user || !unfollowUser) throw new Error("User not found");

  const alreadyFollowing = await findFollow({
    authUserId,
    followerId: unfollowerId,
  });
  if (!alreadyFollowing) {
    throw new Error("Not following");
  }
  await deleteFollow(data);
};
