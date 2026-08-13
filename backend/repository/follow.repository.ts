import { prisma } from "../database/prisma.js";

interface FollowLookup {
  authUserId: string;
  followerId: string;
}

export const findFollow = async (data: FollowLookup) => {
  const { authUserId, followerId } = data;
  return prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId: authUserId, followingId: followerId },
    },
  });
};

export const createFollow = async (data: FollowLookup) => {
  const { authUserId, followerId } = data;
  return prisma.follow.create({
    data: { followerId: authUserId, followingId: followerId },
  });
};

export const deleteFollow = async (data: {
  authUserId: string;
  unfollowerId: string;
}) => {
  const { authUserId, unfollowerId } = data;
  await prisma.follow.delete({
    where: {
      followerId_followingId: { followerId: authUserId, followingId: unfollowerId },
    },
  });
};
