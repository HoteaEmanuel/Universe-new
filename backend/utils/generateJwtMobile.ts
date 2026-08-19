import { updateUser } from "../repository/user.repository.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "../lib/authTokens.js";

export const generateJwtMobile = async (userId: string) => {
  try {
    const accessToken = signAccessToken(userId);
    const refreshToken = signRefreshToken(userId);

    await updateUser(userId, { refreshToken: hashRefreshToken(refreshToken) });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Error generating JWT token:", error);
  }
};
