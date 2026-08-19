import crypto from "crypto";
import jwt from "jsonwebtoken";

export type AuthTokenType = "access" | "refresh";

export interface AuthTokenPayload {
  userId: string;
  type: AuthTokenType;
}

export const signAccessToken = (userId: string) =>
  jwt.sign({ userId, type: "access" }, process.env.JWT_KEY as string, {
    expiresIn: "15m",
  });

export const signRefreshToken = (userId: string) =>
  jwt.sign({ userId, type: "refresh" }, process.env.JWT_KEY as string, {
    expiresIn: "30d",
  });

export const hashRefreshToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Verifies signature + expiry + that the token was issued as the expected
// type, so a leaked refresh token can't be replayed as an access token (or
// vice versa) — they're signed with the same secret and previously carried
// no distinguishing claim at all.
export const verifyAuthToken = (
  token: string,
  expectedType: AuthTokenType,
): AuthTokenPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_KEY as string,
    ) as AuthTokenPayload;
    if (!decoded || decoded.type !== expectedType) return null;
    return decoded;
  } catch {
    return null;
  }
};
