import type { Request, Response } from "express";
import {
  findOrCreateUserPreferences,
  updateUserPreferences,
} from "../repository/preferences.repository.js";

export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const preferences = await findOrCreateUserPreferences(userId);
    return res.status(200).json({ preferences });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Fetching preferences went wrong", error });
  }
};

export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const preferences = await updateUserPreferences(userId, req.body);
    return res
      .status(200)
      .json({ message: "Preferences updated successfully", preferences });
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Updating preferences went wrong", error });
  }
};
