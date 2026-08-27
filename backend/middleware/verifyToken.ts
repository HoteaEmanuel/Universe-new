import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/authTokens.js";
import { AccountBlockedError } from "../lib/accountBlockedError.js";
import { rotateRefreshToken } from "../services/refreshToken.service.js";

const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 15; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 1000 * 60 * 60 * 24 * 30; // 30 days

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
};

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
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
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
