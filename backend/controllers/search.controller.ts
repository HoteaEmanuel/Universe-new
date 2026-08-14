import type { Request, Response } from "express";
import {
  getSearchOverview,
  getSearchedGroups,
  getSearchedPosts,
  getSearchedUsers,
} from "../services/search.service.js";

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

const MIN_QUERY_LENGTH = 2;

const getQuery = (req: Request) => (req.query.q as string | undefined)?.trim() ?? "";

export const getSearchOverviewController = async (req: Request, res: Response) => {
  try {
    const query = getQuery(req);
    if (query.length < MIN_QUERY_LENGTH) {
      return res.status(200).json({
        users: { items: [], hasMore: false },
        posts: { items: [], hasMore: false },
        groups: { items: [], hasMore: false },
      });
    }
    const overview = await getSearchOverview(query, req.userId as string);
    return res.status(200).json({ message: "Fetched search overview", ...overview });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const searchUsersController = async (req: Request, res: Response) => {
  try {
    const query = getQuery(req);
    if (query.length < MIN_QUERY_LENGTH) {
      return res.status(200).json({ items: [], hasMore: false });
    }
    const limit = req.query.limit as unknown as number;
    const offset = req.query.offset as unknown as number;
    const page = await getSearchedUsers(query, limit, offset);
    return res.status(200).json({ message: "Fetched matching users", ...page });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const searchPostsController = async (req: Request, res: Response) => {
  try {
    const query = getQuery(req);
    if (query.length < MIN_QUERY_LENGTH) {
      return res.status(200).json({ items: [], hasMore: false });
    }
    const limit = req.query.limit as unknown as number;
    const offset = req.query.offset as unknown as number;
    const page = await getSearchedPosts(query, limit, offset);
    return res.status(200).json({ message: "Fetched matching posts", ...page });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};

export const searchGroupsController = async (req: Request, res: Response) => {
  try {
    const query = getQuery(req);
    if (query.length < MIN_QUERY_LENGTH) {
      return res.status(200).json({ items: [], hasMore: false });
    }
    const limit = req.query.limit as unknown as number;
    const offset = req.query.offset as unknown as number;
    const page = await getSearchedGroups(query, req.userId as string, limit, offset);
    return res.status(200).json({ message: "Fetched matching groups", ...page });
  } catch (error) {
    return res.status(400).json({ message: errorMessage(error) });
  }
};
