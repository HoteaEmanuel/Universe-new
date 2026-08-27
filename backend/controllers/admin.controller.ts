import type { Request, Response } from "express";
import { prisma } from "../database/prisma.js";
import {
  blockUser as blockUserRepo,
  findAdminStats,
  findDailyActivity,
  findTopUniversities,
  findUsersPage,
  unblockUser as unblockUserRepo,
} from "../repository/admin.repository.js";

export const getStats = async (_req: Request, res: Response) => {
  try {
    const stats = await findAdminStats();
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(400).json({ message: "Could not fetch admin stats" });
  }
};

const DAILY_ACTIVITY_DAYS = 14;

export const getDailyActivity = async (_req: Request, res: Response) => {
  try {
    const activity = await findDailyActivity(DAILY_ACTIVITY_DAYS);
    return res.status(200).json({ activity });
  } catch (error) {
    return res.status(400).json({ message: "Could not fetch daily activity" });
  }
};

const TOP_UNIVERSITIES_LIMIT = 6;

export const getTopUniversities = async (_req: Request, res: Response) => {
  try {
    const universities = await findTopUniversities(TOP_UNIVERSITIES_LIMIT);
    return res.status(200).json({ universities });
  } catch (error) {
    return res.status(400).json({ message: "Could not fetch university breakdown" });
  }
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { search, cursor, limit } = req.query as unknown as {
      search?: string;
      cursor?: string;
      limit: number;
    };
    const page = await findUsersPage({ search, cursor, limit });
    return res.status(200).json(page);
  } catch (error) {
    return res.status(400).json({ message: "Could not fetch users" });
  }
};

export const blockUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { reason } = req.body as { reason?: string };
  try {
    if (id === req.userId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(400).json({ message: "Admins cannot block other admins" });
    }

    await blockUserRepo({ userId: id, blockedByUserId: req.userId as string, reason });

    return res.status(200).json({ message: "User blocked" });
  } catch (error) {
    return res.status(400).json({ message: "Could not block user" });
  }
};

export const unblockUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await unblockUserRepo(id);
    return res.status(200).json({ message: "User unblocked" });
  } catch (error) {
    return res.status(400).json({ message: "Could not unblock user" });
  }
};
