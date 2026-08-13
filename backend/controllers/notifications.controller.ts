import type { Request, Response } from "express";
import { prisma } from "../database/prisma.js";

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return res
        .status(400)
        .json({ message: "User not found with specified id" });

    const notifications = await prisma.notification.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: {
        actionUser: {
          select: { id: true, profilePicture: true, firstName: true, lastName: true, name: true },
        },
      },
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getUnreadMessageNotifications = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const notifications = await prisma.notification.findMany({
      where: { userId: id, read: false, type: "message" },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const getUnreadNotifications = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const notifications = await prisma.notification.findMany({
      where: { userId: id, read: false, type: { not: "message" } },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const deleteNotifications = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notification.deleteMany({ where: { userId: id } });
    return res.status(200).json({ message: "Notifications deleted" });
  } catch (error) {
    return res.status(400).json({ error });
  }
};

export const seeNotifications = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notification.updateMany({
      where: { userId: id },
      data: { read: true },
    });
    return res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};

export const seeNewConversationMessages = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.notification.updateMany({
      where: { userId: req.userId, conversationId: id },
      data: { read: true },
    });
    return res.status(200).json({ message: "All new messages were read" });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : "" });
  }
};
