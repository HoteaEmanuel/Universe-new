import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));
vi.mock("../utils/username.js", () => ({
  generateDefaultUsername: vi.fn(),
  isUsernameUniqueConstraintError: vi.fn(),
}));

import { prisma } from "../database/prisma.js";
import {
  generateDefaultUsername,
  isUsernameUniqueConstraintError,
} from "../utils/username.js";
import {
  createUserWithGeneratedUsername,
  findUserByEmail,
  findUserById,
  recordFailedVerificationAttempt,
  verifyUser,
} from "./user.repository.js";

describe("user.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findUserById omits the password field", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never);

    await findUserById("user-1");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      omit: { password: true },
    });
  });

  it("findUserByEmail looks up by email with no omit", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "user-1" } as never);

    await findUserByEmail("jane@example.com");

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
    });
  });

  it("verifyUser clears verification state and marks the user verified", async () => {
    await verifyUser("user-1");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        verificationCode: null,
        verificationCodeExpiresAt: null,
        verificationAttempts: 0,
        verificationCooldownUntil: null,
        isVerified: true,
      },
    });
  });

  it("recordFailedVerificationAttempt increments attempts and sets the cooldown", async () => {
    const cooldown = new Date("2026-01-01T00:00:00.000Z");

    await recordFailedVerificationAttempt("user-1", cooldown);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        verificationAttempts: { increment: 1 },
        verificationCooldownUntil: cooldown,
      },
    });
  });

  describe("createUserWithGeneratedUsername", () => {
    it("creates the user with a generated username on the first attempt", async () => {
      vi.mocked(generateDefaultUsername).mockReturnValue("jane_doe_ab12cd34");
      vi.mocked(prisma.user.create).mockResolvedValue({ id: "user-1" } as never);

      const result = await createUserWithGeneratedUsername(
        { email: "jane@example.com" } as never,
        "Jane Doe",
      );

      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: "jane@example.com", username: "jane_doe_ab12cd34" },
      });
      expect(result).toEqual({ id: "user-1" });
    });

    it("retries on a username unique-constraint collision and eventually succeeds", async () => {
      vi.mocked(generateDefaultUsername).mockReturnValue("jane_doe_ab12cd34");
      vi.mocked(isUsernameUniqueConstraintError).mockReturnValue(true);
      const conflict = Object.assign(new Error("duplicate"), { code: "P2002" });
      vi.mocked(prisma.user.create)
        .mockRejectedValueOnce(conflict)
        .mockResolvedValueOnce({ id: "user-1" } as never);

      const result = await createUserWithGeneratedUsername(
        { email: "jane@example.com" } as never,
        "Jane Doe",
      );

      expect(prisma.user.create).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ id: "user-1" });
    });

    it("gives up after 3 collisions and surfaces the last error", async () => {
      // The loop's own trailing `throw new Error("Could not allocate a
      // username")` is unreachable: the 3rd iteration (attempt === 2)
      // always rethrows the original error itself instead of falling out
      // of the loop, so callers see the real Prisma error, not that message.
      vi.mocked(generateDefaultUsername).mockReturnValue("jane_doe_ab12cd34");
      vi.mocked(isUsernameUniqueConstraintError).mockReturnValue(true);
      const conflict = Object.assign(new Error("duplicate"), { code: "P2002" });
      vi.mocked(prisma.user.create).mockRejectedValue(conflict);

      await expect(
        createUserWithGeneratedUsername({ email: "jane@example.com" } as never, "Jane Doe"),
      ).rejects.toThrow("duplicate");
      expect(prisma.user.create).toHaveBeenCalledTimes(3);
    });

    it("rethrows immediately on a non-username-collision error", async () => {
      vi.mocked(generateDefaultUsername).mockReturnValue("jane_doe_ab12cd34");
      vi.mocked(isUsernameUniqueConstraintError).mockReturnValue(false);
      const otherError = new Error("connection lost");
      vi.mocked(prisma.user.create).mockRejectedValue(otherError);

      await expect(
        createUserWithGeneratedUsername({ email: "jane@example.com" } as never, "Jane Doe"),
      ).rejects.toThrow("connection lost");
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });
  });
});
