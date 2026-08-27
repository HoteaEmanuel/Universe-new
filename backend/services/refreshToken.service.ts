import { findUserById, updateUser } from "../repository/user.repository.js";
import { findUserAccountStatus } from "../repository/userAccountStatus.repository.js";
import { AccountBlockedError } from "../lib/accountBlockedError.js";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAuthToken,
} from "../lib/authTokens.js";

export class RefreshTokenReuseError extends Error {}

interface RotatedSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

// Verifies a presented refresh token against the hash stored for that user
// and rotates it: a fresh access+refresh pair is issued and only the new
// refresh token's hash is stored, invalidating the one just used. Any token
// that fails signature/type/expiry checks, or doesn't match the hash on file
// (already rotated away, forged, or a stale copy of a stolen token), throws
// RefreshTokenReuseError and revokes the account's current session outright —
// there's no legitimate reason a valid holder would ever present a token
// other than the one most recently issued to them.
export const rotateRefreshToken = async (
  presentedToken: string,
): Promise<RotatedSession> => {
  const decoded = verifyAuthToken(presentedToken, "refresh");
  if (!decoded) {
    throw new RefreshTokenReuseError("Invalid refresh token");
  }

  const user = await findUserById(decoded.userId);
  const presentedHash = hashRefreshToken(presentedToken);

  if (!user || user.refreshToken !== presentedHash) {
    if (user) await updateUser(user.id, { refreshToken: null });
    throw new RefreshTokenReuseError("Session expired, please log in again");
  }

  const accountStatus = await findUserAccountStatus(user.id);
  if (accountStatus?.status === "blocked") {
    await updateUser(user.id, { refreshToken: null });
    throw new AccountBlockedError(accountStatus.reason ?? null);
  }

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  await updateUser(user.id, { refreshToken: hashRefreshToken(refreshToken) });

  return { userId: user.id, accessToken, refreshToken };
};
