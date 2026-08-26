import type { NextFunction, Request, Response } from "express";
import { getBidirectionalBlockedIds } from "../lib/blockCache.js";

export const loadBlockedIds = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  req.blockedIds = req.userId
    ? await getBidirectionalBlockedIds(req.userId)
    : new Set();
  next();
};
