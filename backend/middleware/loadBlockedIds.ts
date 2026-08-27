import type { NextFunction, Request, Response } from "express";
import { getBidirectionalBlockedIds } from "../lib/blockCache.js";

export const loadBlockedIds = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  /* Middleware that sets in the request the ids
   of the users who were blocked and who blocked the current auth user
   The user doesnt want to see data about the blocked users and cannot access data
   of users who blocked it
   */
  req.blockedIds = req.userId
    ? await getBidirectionalBlockedIds(req.userId)
    : new Set();
  next();
};
