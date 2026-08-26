import type { Request, Response } from "express";
import { blockUser, unblockUser, getBlockedUsers } from "../services/block.service.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const blockUserController = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId as string;
    const { userId } = req.body;
    await blockUser({ authUserId, targetUserId: userId });
    return res.status(200).json({ message: "User blocked" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const unblockUserController = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId as string;
    const { userId } = req.body;
    await unblockUser({ authUserId, targetUserId: userId });
    return res.status(200).json({ message: "User unblocked" });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const getBlockedUsersController = async (req: Request, res: Response) => {
  try {
    const authUserId = req.userId as string;
    const blockedUsers = await getBlockedUsers(authUserId);
    return res.status(200).json({ message: "Fetched blocked users", blockedUsers });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};
