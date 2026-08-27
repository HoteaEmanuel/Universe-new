import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/user.repository.js", () => ({
  findUserById: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../repository/userAccountStatus.repository.js", () => ({
  findUserAccountStatus: vi.fn(),
}));

import { hashRefreshToken, signAccessToken, signRefreshToken } from "../lib/authTokens.js";
import { findUserById, updateUser } from "../repository/user.repository.js";
import { findUserAccountStatus } from "../repository/userAccountStatus.repository.js";
import { AccountBlockedError } from "../lib/accountBlockedError.js";
import { RefreshTokenReuseError, rotateRefreshToken } from "./refreshToken.service.js";

beforeAll(() => {
  process.env.JWT_KEY = "test-jwt-secret";
});

describe("rotateRefreshToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findUserAccountStatus).mockResolvedValue(null as never);
  });

  it("throws RefreshTokenReuseError for a malformed token", async () => {
    await expect(rotateRefreshToken("not-a-real-token")).rejects.toThrow(RefreshTokenReuseError);
    expect(findUserById).not.toHaveBeenCalled();
  });

  it("throws RefreshTokenReuseError when a valid access token is presented instead of a refresh token", async () => {
    const accessToken = signAccessToken("user-1");
    await expect(rotateRefreshToken(accessToken)).rejects.toThrow(RefreshTokenReuseError);
  });

  it("throws and does nothing further when the user no longer exists", async () => {
    const refreshToken = signRefreshToken("user-1");
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(rotateRefreshToken(refreshToken)).rejects.toThrow(RefreshTokenReuseError);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("revokes the session and throws when the presented token doesn't match the stored hash (reuse)", async () => {
    const refreshToken = signRefreshToken("user-1");
    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      refreshToken: "some-other-hash",
    } as never);

    await expect(rotateRefreshToken(refreshToken)).rejects.toThrow(RefreshTokenReuseError);
    expect(updateUser).toHaveBeenCalledWith("user-1", { refreshToken: null });
  });

  it("rotates the token pair and stores the new hash when the token matches", async () => {
    const refreshToken = signRefreshToken("user-1");
    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      refreshToken: hashRefreshToken(refreshToken),
    } as never);

    const result = await rotateRefreshToken(refreshToken);

    expect(result.userId).toBe("user-1");
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(updateUser).toHaveBeenCalledWith("user-1", {
      refreshToken: hashRefreshToken(result.refreshToken),
    });
  });

  it("throws AccountBlockedError and revokes the session when the user is blocked", async () => {
    const refreshToken = signRefreshToken("user-1");
    vi.mocked(findUserById).mockResolvedValue({
      id: "user-1",
      refreshToken: hashRefreshToken(refreshToken),
    } as never);
    vi.mocked(findUserAccountStatus).mockResolvedValue({
      status: "blocked",
      reason: "Spamming",
    } as never);

    await expect(rotateRefreshToken(refreshToken)).rejects.toThrow(AccountBlockedError);
    expect(updateUser).toHaveBeenCalledWith("user-1", { refreshToken: null });
  });
});
