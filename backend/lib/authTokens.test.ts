import { beforeAll, describe, expect, it } from "vitest";
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyAuthToken,
} from "./authTokens.js";

beforeAll(() => {
  process.env.JWT_KEY = "test-jwt-secret";
});

describe("authTokens", () => {
  it("signs and verifies an access token", () => {
    const token = signAccessToken("user-1");
    const decoded = verifyAuthToken(token, "access");
    expect(decoded).toMatchObject({ userId: "user-1", type: "access" });
  });

  it("signs and verifies a refresh token", () => {
    const token = signRefreshToken("user-1");
    const decoded = verifyAuthToken(token, "refresh");
    expect(decoded).toMatchObject({ userId: "user-1", type: "refresh" });
  });

  it("rejects a refresh token presented as an access token", () => {
    const refreshToken = signRefreshToken("user-1");
    expect(verifyAuthToken(refreshToken, "access")).toBeNull();
  });

  it("rejects an access token presented as a refresh token", () => {
    const accessToken = signAccessToken("user-1");
    expect(verifyAuthToken(accessToken, "refresh")).toBeNull();
  });

  it("rejects a malformed or garbage token", () => {
    expect(verifyAuthToken("not-a-real-token", "access")).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = signAccessToken("user-1");
    const originalKey = process.env.JWT_KEY;
    process.env.JWT_KEY = "a-different-secret";
    expect(verifyAuthToken(token, "access")).toBeNull();
    process.env.JWT_KEY = originalKey;
  });

  it("hashes a refresh token deterministically", () => {
    const token = "some-refresh-token";
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    expect(hashRefreshToken(token)).not.toBe(token);
  });
});
