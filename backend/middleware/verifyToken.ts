import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/authTokens.js";
import { AccountBlockedError } from "../lib/accountBlockedError.js";
import { rotateRefreshToken } from "../services/refreshToken.service.js";
import { clearAuthCookies, setAuthCookies } from "../lib/authCookies.js";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token: string | null = null;
  const authHeader = (req.headers["authorization"] ||
    req.headers["Authorization"]) as string | undefined;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token && req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  const refreshToken = req.cookies?.refreshToken;

  if (!token && refreshToken) {
    try {
      const rotated = await rotateRefreshToken(refreshToken);
      setAuthCookies(res, rotated.accessToken, rotated.refreshToken);
      req.userId = rotated.userId;
      return next();
    } catch (error) {
      clearAuthCookies(res);
      if (error instanceof AccountBlockedError) {
        return res
          .status(403)
          .json({ message: error.message, code: "ACCOUNT_BLOCKED" });
      }
      return res.status(401).json({ message: "Session expired" });
    }
  }

  if (!token) return res.status(401).json({ message: "Not authenticated" });

  const decoded = verifyAuthToken(token, "access");
  if (!decoded) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = decoded.userId;
  next();
};
