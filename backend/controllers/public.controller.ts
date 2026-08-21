import type { Request, Response } from "express";
import { prisma } from "../database/prisma.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const getPublicPostController = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        body: true,
        location: true,
        imagesUrls: true,
        createdAt: true,
        tags: { select: { name: true } },
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            name: true,
            profilePicture: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });
    if (!post) return res.status(404).json({ message: "Post not found" });
    return res.status(200).json({ message: "Fetched post", post });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};
