import {
  createFollow,
  deleteFollow,
  findFollow,
} from "../repository/follow.repository.js";
import {
  createSavedPost,
  deleteSavedPost,
  findPostById,
  findSavedPostByIds,
} from "../repository/post.repository.js";
import { deleteUser, findUserById } from "../repository/user.repository.js";
import {
  createNotification,
  emitNewNotification,
} from "../repository/notification.repository.js";
import { prisma } from "../database/prisma.js";
import { deleteImages } from "../lib/storage.js";

export const toggleSavePost = async (data: { postId: string; authUserId: string }) => {
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
    await deleteSavedPost(authUserId, postId);
    return { saved: false };
  }
  await createSavedPost(authUserId, postId);
  return { saved: true };
};

export const follow = async (data: { authUserId: string; followerId: string }) => {
  const { authUserId, followerId } = data;
  if (authUserId === followerId) {
    throw new Error("Cannot follow yourself");
  }

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
  await emitNewNotification(followerId, notification);
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

// prisma.user.delete cascades in the database to every Post, Message (as
// sender OR receiver), GroupMessage, CourseResource and Event this user
// owns/sent/participated in - none of which frees their R2 objects on its
// own. Once the cascade runs, the keys are gone from the DB and
// unrecoverable, so they're gathered here first.
export const deleteAccountService = async (userId: string) => {
  const [user, posts, messages, groupMessages, resources, events] =
    await Promise.all([
      findUserById(userId),
      prisma.post.findMany({
        where: { userId },
        select: { imagesPublicIds: true },
      }),
      // Cascades on either party - a message this user only received still
      // disappears (and its images/files with it) when this user is deleted.
      prisma.message.findMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
        select: {
          imagePublicIds: true,
          audioKey: true,
          attachments: { select: { fileKey: true } },
        },
      }),
      prisma.groupMessage.findMany({
        where: { senderId: userId },
        select: {
          imagePublicIds: true,
          audioKey: true,
          attachments: { select: { fileKey: true } },
        },
      }),
      prisma.courseResource.findMany({
        where: { uploaderId: userId },
        select: { fileKey: true },
      }),
      prisma.event.findMany({
        where: { creatorId: userId },
        select: { coverImageKey: true },
      }),
    ]);
  if (!user) throw new Error("User not found");

  const keysToDelete = [
    ...(user.profilePictureKey ? [user.profilePictureKey] : []),
    ...posts.flatMap((post) => post.imagesPublicIds),
    ...[...messages, ...groupMessages].flatMap((message) => [
      ...message.imagePublicIds,
      ...(message.audioKey ? [message.audioKey] : []),
      ...message.attachments.map((attachment) => attachment.fileKey),
    ]),
    ...resources.flatMap((resource) => (resource.fileKey ? [resource.fileKey] : [])),
    ...events.flatMap((event) => (event.coverImageKey ? [event.coverImageKey] : [])),
  ];

  await deleteUser(userId);

  // Awaited, same reasoning as deleteGroupService - still non-throwing, so
  // a storage hiccup doesn't undo an account deletion the user already got
  // confirmation of.
  if (keysToDelete.length > 0) {
    await deleteImages(keysToDelete).catch((error: unknown) => {
      console.error(`Failed to delete storage objects for deleted account ${userId}:`, error);
    });
  }
};
