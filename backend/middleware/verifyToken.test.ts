import type { NextFunction, Request, Response } from "express";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/refreshToken.service.js", async () => {
  const actual = await vi.importActual<typeof import("../services/refreshToken.service.js")>(
    "../services/refreshToken.service.js",
  );
  return {
    RefreshTokenReuseError: actual.RefreshTokenReuseError,
    rotateRefreshToken: vi.fn(),
  };
});

import { signAccessToken, signRefreshToken } from "../lib/authTokens.js";
import {
  RefreshTokenReuseError,
  rotateRefreshToken,
} from "../services/refreshToken.service.js";
import { verifyToken } from "./verifyToken.js";

beforeAll(() => {
  process.env.JWT_KEY = "test-jwt-secret";
});

const buildRes = () => {
  const res = {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  return res;
};

describe("verifyToken middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticates via a Bearer access token and calls next()", async () => {
    const token = signAccessToken("user-1");
    const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} } as unknown as Request;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    await verifyToken(req, res, next);

    expect(req.userId).toBe("user-1");
    expect(next).toHaveBeenCalled();
  });

  it("authenticates via an accessToken cookie and calls next()", async () => {
    const token = signAccessToken("user-1");
    const req = { headers: {}, cookies: { accessToken: token } } as unknown as Request;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    await verifyToken(req, res, next);

    expect(req.userId).toBe("user-1");
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 when there is no token and no refresh cookie", async () => {
    const req = { headers: {}, cookies: {} } as unknown as Request;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid access token", async () => {
    const req = { headers: {}, cookies: { accessToken: "garbage" } } as unknown as Request;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("falls back to rotating the refresh token when no access token is present", async () => {
    const refreshToken = signRefreshToken("user-1");
    vi.mocked(rotateRefreshToken).mockResolvedValue({
      userId: "user-1",
      accessToken: "new-access",
      refreshToken: "new-refresh",
    });
    const req = { headers: {}, cookies: { refreshToken } } as unknown as Request;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    await verifyToken(req, res, next);

    expect(req.userId).toBe("user-1");
    expect(res.cookie).toHaveBeenCalledWith("accessToken", "new-access", expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith("refreshToken", "new-refresh", expect.any(Object));
    expect(next).toHaveBeenCalled();
  });

  it("clears cookies and returns 401 when the refresh token is reused/invalid", async () => {
    vi.mocked(rotateRefreshToken).mockRejectedValue(
      new RefreshTokenReuseError("Session expired, please log in again"),
    );
    const req = { headers: {}, cookies: { refreshToken: "stale-token" } } as unknown as Request;
    const res = buildRes();
    const next = vi.fn() as NextFunction;

    await verifyToken(req, res, next);

    expect(res.clearCookie).toHaveBeenCalledWith("accessToken");
    expect(res.clearCookie).toHaveBeenCalledWith("refreshToken");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
