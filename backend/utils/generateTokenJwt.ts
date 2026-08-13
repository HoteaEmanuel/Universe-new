import jwt from "jsonwebtoken";
import type { Response } from "express";
import { updateUser } from "../repository/user.repository.js";

export const generateToken = async (res: Response, userId: string) => {
  const token = jwt.sign({ userId }, process.env.JWT_KEY, {
    expiresIn: "15m",
  });

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1 * 1000 * 60 * 15, // 15 minutes
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_KEY, {
    expiresIn: "30d",
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  await updateUser(userId, { refreshToken });
  return token;
};
