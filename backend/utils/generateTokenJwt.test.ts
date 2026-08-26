import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/user.repository.js", () => ({
  updateUser: vi.fn(),
}));

import { updateUser } from "../repository/user.repository.js";
import { generateToken } from "./generateTokenJwt.js";

beforeAll(() => {
  process.env.JWT_KEY = "test-jwt-secret";
});

describe("generateToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets httpOnly access and refresh cookies and persists the hashed refresh token", async () => {
    const cookie = vi.fn();
    const res = { cookie } as unknown as import("express").Response;

    const accessToken = await generateToken(res, "user-1");

    expect(accessToken).toEqual(expect.any(String));
    expect(cookie).toHaveBeenCalledWith(
      "accessToken",
      accessToken,
      expect.objectContaining({ httpOnly: true, maxAge: 15 * 60 * 1000 }),
    );
    expect(cookie).toHaveBeenCalledWith(
      "refreshToken",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 }),
    );
    expect(updateUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ refreshToken: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    );
  });
});
