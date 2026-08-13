import type { Request, Response } from "express";
import type {} from "multer";
import { uploadImageAndCleanup } from "../lib/cloudinary.js";
import { prisma } from "../database/prisma.js";
import { redis } from "../lib/redis.js";
import { findUserById, updateUser } from "../repository/user.repository.js";
import { follow, savePost, unfollow } from "../services/user.service.js";

const PROFILE_CARD_SELECT = {
  id: true,
  profilePicture: true,
  firstName: true,
  lastName: true,
} as const;

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        firstName: true,
        lastName: true,
        id: true,
        profilePicture: true,
        accountType: true,
        university: true,
        name: true,
      },
    });
    return res.status(200).json(users);
  } catch (error) {}
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      omit: { password: true },
    });
    if (!user) throw new Error("User not found");
    return res.status(200).json({ message: "User found", user });
  } catch (error) {
    return res.status(404).json({ message: "User not found" });
  }
};

export const getUserByName = async (req: Request, res: Response) => {
  try {
    let { name } = req.params;
    name = (name as string).replace(/-/g, " ").trim();

    let userWithName = await prisma.user.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (!userWithName) {
      const candidates = await prisma.user.findMany({
        where: { firstName: { not: null }, lastName: { not: null } },
      });
      userWithName =
        candidates.find(
          (u) =>
            `${u.firstName} ${u.lastName}`.toLowerCase() === name.toLowerCase(),
        ) ?? null;
    }

    if (!userWithName) throw new Error("User not found");
    return res.status(200).json({ message: "User found", user: userWithName });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const updateUserImage = async (req: Request, res: Response) => {
  const file = req.file;
  try {
    const user = await findUserById(req.userId as string);
    if (!user) throw new Error("User not found");
    if (!file) throw new Error("No file uploaded");
    const result = await uploadImageAndCleanup(file.path, {
      folder: "users",
      resource_type: "image",
    });

    await updateUser(user.id, { profilePicture: result.secure_url });
    return res.status(200).json({ message: "Updated the image successfully" });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const savePostController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = { authUserId: req.userId as string, postId: id };
    const savedPost = await savePost(data);
    return res.status(200).json({ message: "Saved the post", data: savedPost });
  } catch (error) {
    return res
      .status(400)
      .json({ message: error instanceof Error ? error.message : "" });
  }
};

export const unsavePost = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId as string;
    await prisma.savedPost.deleteMany({ where: { userId, postId: id } });
    return res.status(200).json({ message: "Post was unsaved" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const followController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const followerId = req.body.followerId;
    await follow({ authUserId: userId, followerId });
    return res.status(200).json({ message: "Followed :)!" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const unfollowController = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const unfollowId = req.body.unfollowId;
    await unfollow({ authUserId: userId, unfollowerId: unfollowId });
    return res.status(200).json({ message: "Unfollowed!" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: PROFILE_CARD_SELECT } },
    });
    const data = followers.map((f) => f.follower);
    try {
      await redis.set("followers-" + userId, JSON.stringify(data));
    } catch (cacheError) {
      console.warn("Redis cache write failed (non-fatal):", cacheError);
    }
    return res.status(200).json({
      message: "Fetched the followers",
      followers: data,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    let followingFromCache: string | null = null;
    try {
      followingFromCache = await redis.get("following-" + userId);
    } catch (cacheError) {
      console.warn("Redis cache read failed (non-fatal):", cacheError);
    }
    if (followingFromCache) {
      return res.status(200).json({
        message: "Fetched the following",
        following: followingFromCache,
      });
    }
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            ...PROFILE_CARD_SELECT,
            accountType: true,
            university: true,
            name: true,
          },
        },
      },
    });
    const data = following.map((f) => f.following);
    try {
      await redis.set("following-" + userId, JSON.stringify(data));
    } catch (cacheError) {
      console.warn("Redis cache write failed (non-fatal):", cacheError);
    }
    return res.status(200).json({
      message: "Fetched the following",
      following: data,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const followsUser = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const otherUserId = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
    });
    if (!user || !otherUser) throw new Error("No user found");
    const isFollowing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: otherUserId,
        },
      },
    });
    return res
      .status(200)
      .json({ message: "Check if its following", isFollowing });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getUsersFromSameUniversity = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.userId as string;
    const authUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!authUser) throw new Error("User not found");
    const usersFromSameUniversity = await prisma.user.findMany({
      where: { university: authUser.university, id: { not: userId } },
      select: {
        firstName: true,
        lastName: true,
        profilePicture: true,
        accountType: true,
        id: true,
        university: true,
      },
    });
    return res.status(200).json({
      message: "Fetched users from same university",
      users: usersFromSameUniversity,
    });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const updateBio = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { bio } = req.body;
    const user = await findUserById(userId);
    if (!user) throw new Error("User not found");
    await updateUser(userId, { bio });
    return res.status(200).json({ message: "Bio updated successfully" });
  } catch (error) {
    return res.status(400).json({ message: "Updating bio went wrong", error });
  }
};
