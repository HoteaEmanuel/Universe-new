import type { Response } from "express";
import { updateUser } from "../repository/user.repository.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "../lib/authTokens.js";

export const generateToken = async (res: Response, userId: string) => {
  const token = signAccessToken(userId);

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1 * 1000 * 60 * 15, // 15 minutes
  });
  const refreshToken = signRefreshToken(userId);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Store only the hash — the DB is never a bearer credential on its own,
  // matching the reset-token fix (see auth.service.ts's forgotPassword).
  await updateUser(userId, { refreshToken: hashRefreshToken(refreshToken) });
  return token;
};
