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
import { redis } from "../lib/redis.js";
import { createNotification } from "../repository/notification.repository.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
export const savePost = async (data) => {
  const { postId, authUserId } = data;
  const post = await findPostById(postId);
  if (!post) throw new Error("Post not found");

  const user = await findUserById(authUserId);
  if (!user) throw new Error("User not found");
  if (post.userId.equals(authUserId)) {
    throw new Error("Saving works only for other users posts");
  }
  const alreadySaved = await findSavedPostByIds(authUserId, postId);
  if (alreadySaved) {
    throw new Error("Already saved");
  }
  const savedPost = await createSavedPost(authUserId, postId);
  return savedPost;
};

export const follow = async (data) => {
  const { authUserId, followerId } = data;
  if (
    authUserId === null ||
    authUserId === undefined ||
    followerId === null ||
    followerId === undefined
  )
    throw new Error("Empty data");
  const user = await findUserById(authUserId);
  const toFollowUser = await findUserById(followerId);
  // const followedFromCache = await redis.get("followers-" + followerId);
  // const followingFromCache = await redis.get("following-" + authUserId);
  // if (followingFromCache) await redis.del("following-" + authUserId);
  // if (followedFromCache) await redis.del("followers-" + followerId);
  if (!user || !toFollowUser) throw new Error("User not found");

  const followData = { authUserId, followerId };
  const alreadyFollowing = await findFollow(followData);
  if (alreadyFollowing) {
    throw new Error("Already following");
  }
  const follow = await createFollow(followData);
  const notifData = {
    title: "New follow",
    message: `${user.firstName} started following you!`,
    userId: followerId,
    actionUserId: authUserId,
    type: "follow",
  };
  const notification = await createNotification(notifData);
  // Send notification to the followed user in real time if they are connected
  io.to(getReceiverSocketId(followerId.toString())).emit(
    "newNotification",
    notification,
  );
};

export const unfollow = async (data) => {
  const { authUserId, unfollowerId } = data;
  const user = await findUserById(authUserId);
  const unfollowUser = await findUserById(unfollowerId);
  // const followedFromCache = await redis.get("followers-" + unfollowerId);
  // const followingFromCache = await redis.get("following-" + authUserId);
  // if (followingFromCache) await redis.del("following-" + authUserId);
  // if (followedFromCache) await redis.del("followers-" + unfollowerId);
  if (!user || !unfollowUser) throw new Error("User not found");

  const alreadyFollowing = await findFollow(data);
  if (!alreadyFollowing) {
    throw new Error("Not following");
  }
  await deleteFollow(data);
};
