import type { Response } from "express";
import { updateUser } from "../repository/user.repository.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "../lib/authTokens.js";
import { setAuthCookies } from "../lib/authCookies.js";

export const generateToken = async (res: Response, userId: string) => {
  const token = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  setAuthCookies(res, token, refreshToken);

  // Store only the hash — the DB is never a bearer credential on its own,
  // matching the reset-token fix (see auth.service.ts's forgotPassword).
  await updateUser(userId, { refreshToken: hashRefreshToken(refreshToken) });
  return token;
};
