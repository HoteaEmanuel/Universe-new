import type { Response } from "express";
import { updateUser } from "../repository/user.repository.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "../lib/authTokens.js";

export const generateToken = async (res: Response, userId: string) => {
  const token = signAccessToken(userId);

  // The frontend and backend live on different *.onrender.com subdomains,
  // which the browser treats as different sites (onrender.com is on the
  // public suffix list) - SameSite=Strict/Lax cookies never ride along on
  // those cross-site requests, so login would appear to succeed but every
  // request after it would show up unauthenticated. SameSite=None requires
  // Secure, which is already true whenever this runs in production.
  const sameSite = process.env.NODE_ENV === "production" ? "none" : "lax";

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
    maxAge: 1 * 1000 * 60 * 15, // 15 minutes
  });
  const refreshToken = signRefreshToken(userId);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Store only the hash — the DB is never a bearer credential on its own,
  // matching the reset-token fix (see auth.service.ts's forgotPassword).
  await updateUser(userId, { refreshToken: hashRefreshToken(refreshToken) });
  return token;
};
