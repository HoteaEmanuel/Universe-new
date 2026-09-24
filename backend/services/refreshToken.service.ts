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

// A browser fires several requests in parallel; once the access-token cookie
// expires they all carry the same still-valid refresh cookie and would
// otherwise race to rotate it. Only the first should actually perform the
// rotation - the rest await and share its result, rather than each failing
// the hash check against the token the first one just rotated away (which
// used to look identical to a stolen/replayed token and wiped the session).
const inFlightRotations = new Map<string, Promise<RotatedSession>>();

const performRotation = async (
  userId: string,
  presentedHash: string,
): Promise<RotatedSession> => {
  const user = await findUserById(userId);

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

  const presentedHash = hashRefreshToken(presentedToken);

  const inFlight = inFlightRotations.get(presentedHash);
  if (inFlight) return inFlight;

  const rotation = performRotation(decoded.userId, presentedHash).finally(
    () => {
      inFlightRotations.delete(presentedHash);
    },
  );
  inFlightRotations.set(presentedHash, rotation);

  return rotation;
};
