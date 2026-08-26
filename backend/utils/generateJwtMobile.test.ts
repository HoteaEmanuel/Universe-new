import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/user.repository.js", () => ({
  updateUser: vi.fn(),
}));

import { updateUser } from "../repository/user.repository.js";
import { generateJwtMobile } from "./generateJwtMobile.js";

beforeAll(() => {
  process.env.JWT_KEY = "test-jwt-secret";
});

describe("generateJwtMobile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a fresh access/refresh pair and persists the hashed refresh token", async () => {
    vi.mocked(updateUser).mockResolvedValue({} as never);

    const tokens = await generateJwtMobile("user-1");

    expect(tokens?.accessToken).toEqual(expect.any(String));
    expect(tokens?.refreshToken).toEqual(expect.any(String));
    expect(updateUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ refreshToken: expect.stringMatching(/^[a-f0-9]{64}$/) }),
    );
  });

  it("swallows the error and returns undefined if persisting the token fails", async () => {
    vi.mocked(updateUser).mockRejectedValue(new Error("db down"));

    const tokens = await generateJwtMobile("user-1");

    expect(tokens).toBeUndefined();
  });
});
