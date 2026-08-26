import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/user.repository.js", () => ({
  createNormalAccount: vi.fn(),
  createUniversityAccount: vi.fn(),
  findUserByEmail: vi.fn(),
  findUserByPasswordResetToken: vi.fn(),
  recordFailedVerificationAttempt: vi.fn(),
  updateUser: vi.fn(),
  verifyUser: vi.fn(),
}));
vi.mock("../queues/emailQueue.js", () => ({
  resetPasswordEmailQueue: { add: vi.fn() },
  verifyEmailQueue: { add: vi.fn() },
  welcomeEmailQueue: { add: vi.fn() },
}));
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    genSalt: vi.fn(),
    hash: vi.fn(),
  },
}));

import bcryptjs from "bcryptjs";
import {
  findUserByEmail,
  findUserByPasswordResetToken,
  recordFailedVerificationAttempt,
  updateUser,
  verifyUser,
} from "../repository/user.repository.js";
import {
  resetPasswordEmailQueue,
  verifyEmailQueue,
  welcomeEmailQueue,
} from "../queues/emailQueue.js";
import {
  forgotPassword,
  login,
  resetPassword,
  sendVerificationEmail,
  signUp,
  verifyEmail,
} from "./auth.service.js";

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    const baseUser = {
      id: "user-1",
      isVerified: true,
      accountType: "normal",
      identityVerified: "true",
      password: "hashed-password",
    };

    it("rejects when no user exists for the email", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);

      await expect(
        login({ email: "jane@example.com", password: "secret123" }),
      ).rejects.toThrow("Authentication failed");
    });

    it("rejects an unverified user even with the correct password", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({ ...baseUser, isVerified: false } as never);

      await expect(
        login({ email: "jane@example.com", password: "secret123" }),
      ).rejects.toThrow("Authentication failed");
      expect(bcryptjs.compare).not.toHaveBeenCalled();
    });

    it("rejects a rejected business account", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        ...baseUser,
        accountType: "business",
        identityVerified: "rejected",
      } as never);

      await expect(
        login({ email: "jane@example.com", password: "secret123" }),
      ).rejects.toThrow("Authentication failed");
    });

    it("rejects a not-yet-verified business account", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        ...baseUser,
        accountType: "business",
        identityVerified: "false",
      } as never);

      await expect(
        login({ email: "jane@example.com", password: "secret123" }),
      ).rejects.toThrow("Authentication failed");
    });

    it("rejects a wrong password", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(baseUser as never);
      vi.mocked(bcryptjs.compare).mockResolvedValue(false as never);

      await expect(
        login({ email: "jane@example.com", password: "wrong-pass" }),
      ).rejects.toThrow("Authentication failed");
      expect(updateUser).not.toHaveBeenCalled();
    });

    it("logs in successfully, updates lastLogin, and strips the password", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(baseUser as never);
      vi.mocked(bcryptjs.compare).mockResolvedValue(true as never);
      vi.mocked(updateUser).mockResolvedValue({ ...baseUser, lastLogin: new Date() } as never);

      const result = await login({ email: "jane@example.com", password: "secret123" });

      expect(updateUser).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ resetPasswordToken: null, resetPasswordExpiresAt: null }),
      );
      expect(result).not.toHaveProperty("password");
    });
  });

  describe("signUp", () => {
    it("rejects when the email is already registered", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({ id: "existing" } as never);

      await expect(
        signUp({
          email: "jane@stanford.edu",
          password: "secret123",
          accountType: "normal",
          firstName: "Jane",
          lastName: "Doe",
        }),
      ).rejects.toThrow("Registration failed");
    });

    it("rejects a non-university email domain", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);

      await expect(
        signUp({
          email: "jane@not-a-university.com",
          password: "secret123",
          accountType: "normal",
          firstName: "Jane",
          lastName: "Doe",
        }),
      ).rejects.toThrow("Not a university email");
    });

    it("queues a verification email and returns the created user on success", async () => {
      const { createNormalAccount } = await import("../repository/user.repository.js");
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      vi.mocked(bcryptjs.genSalt).mockResolvedValue("salt" as never);
      vi.mocked(bcryptjs.hash).mockResolvedValue("hashed" as never);
      vi.mocked(createNormalAccount).mockResolvedValue({
        id: "user-1",
        email: "jane@unibuc.ro",
      } as never);

      const user = await signUp({
        email: "jane@unibuc.ro",
        password: "secret123",
        accountType: "normal",
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(user).toEqual({ id: "user-1", email: "jane@unibuc.ro" });
      expect(verifyEmailQueue.add).toHaveBeenCalledWith(
        "sendVerificationEmail",
        expect.objectContaining({ to: "jane@unibuc.ro" }),
      );
    });
  });

  describe("verifyEmail", () => {
    const baseUser = {
      id: "user-1",
      email: "jane@stanford.edu",
      firstName: "Jane",
      verificationCode: "123456",
      verificationAttempts: 0,
      verificationCooldownUntil: null,
      verificationCodeExpiresAt: new Date(Date.now() + 10_000),
    };

    it("rejects an unknown email", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      await expect(verifyEmail("jane@stanford.edu", "123456")).rejects.toThrow(
        "Verification code is wrong",
      );
    });

    it("rejects while the cooldown window is still active", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        ...baseUser,
        verificationCooldownUntil: new Date(Date.now() + 60_000),
      } as never);

      await expect(verifyEmail("jane@stanford.edu", "123456")).rejects.toThrow(
        "Too many failed attempts",
      );
    });

    it("records a failed attempt and starts a cooldown after the 5th wrong code", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        ...baseUser,
        verificationAttempts: 4,
      } as never);

      await expect(verifyEmail("jane@stanford.edu", "wrong")).rejects.toThrow(
        "Verification code is wrong",
      );
      expect(recordFailedVerificationAttempt).toHaveBeenCalledWith(
        "user-1",
        expect.any(Date),
      );
    });

    it("records a failed attempt without a cooldown before the 5th wrong code", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(baseUser as never);

      await expect(verifyEmail("jane@stanford.edu", "wrong")).rejects.toThrow(
        "Verification code is wrong",
      );
      expect(recordFailedVerificationAttempt).toHaveBeenCalledWith("user-1", null);
    });

    it("rejects an expired code", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        ...baseUser,
        verificationCodeExpiresAt: new Date(Date.now() - 10_000),
      } as never);

      await expect(verifyEmail("jane@stanford.edu", "123456")).rejects.toThrow(
        "Verification code is expired",
      );
    });

    it("verifies the user and queues a welcome email on a correct code", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(baseUser as never);

      await verifyEmail("jane@stanford.edu", "123456");

      expect(verifyUser).toHaveBeenCalledWith("user-1");
      expect(welcomeEmailQueue.add).toHaveBeenCalledWith(
        "sendWelcomeEmail",
        expect.objectContaining({ email: "jane@stanford.edu" }),
      );
    });
  });

  describe("sendVerificationEmail", () => {
    it("rejects an unknown email", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      await expect(sendVerificationEmail("jane@stanford.edu")).rejects.toThrow(
        "User not found",
      );
    });

    it("rejects an already-verified user", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({ id: "user-1", isVerified: true } as never);
      await expect(sendVerificationEmail("jane@stanford.edu")).rejects.toThrow(
        "already verified",
      );
    });

    it("resets attempt state and queues a fresh code", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        id: "user-1",
        email: "jane@stanford.edu",
        isVerified: false,
      } as never);

      await sendVerificationEmail("jane@stanford.edu");

      expect(updateUser).toHaveBeenCalledWith(
        "user-1",
        expect.objectContaining({ verificationAttempts: 0, verificationCooldownUntil: null }),
      );
      expect(verifyEmailQueue.add).toHaveBeenCalled();
    });
  });

  describe("forgotPassword", () => {
    it("rejects an unknown email", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      await expect(forgotPassword("jane@stanford.edu")).rejects.toThrow(
        "User not found with provided email",
      );
    });

    it("stores a hashed reset token and queues the reset email", async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({ id: "user-1", email: "jane@stanford.edu" } as never);

      await forgotPassword("jane@stanford.edu");

      expect(updateUser).toHaveBeenCalledWith(
        "user-1",
        // A sha256 hex digest (64 chars) — not the raw 40-char token that
        // gets emailed, which is never persisted (see auth.service.ts).
        expect.objectContaining({ resetPasswordToken: expect.stringMatching(/^[a-f0-9]{64}$/) }),
      );
      expect(resetPasswordEmailQueue.add).toHaveBeenCalledWith(
        "resetPasswordEmail",
        expect.objectContaining({ email: "jane@stanford.edu" }),
      );
    });
  });

  describe("resetPassword", () => {
    it("rejects an unknown/invalid token", async () => {
      vi.mocked(findUserByPasswordResetToken).mockResolvedValue(null);
      await expect(resetPassword("newpass123", "raw-token")).rejects.toThrow(
        "Something went wrong",
      );
    });

    it("rejects an expired token", async () => {
      vi.mocked(findUserByPasswordResetToken).mockResolvedValue({
        id: "user-1",
        resetPasswordExpiresAt: new Date(Date.now() - 1000),
      } as never);

      await expect(resetPassword("newpass123", "raw-token")).rejects.toThrow(
        "Reset link has expired",
      );
    });

    it("updates the password and clears the reset token and refresh token", async () => {
      vi.mocked(findUserByPasswordResetToken).mockResolvedValue({
        id: "user-1",
        resetPasswordExpiresAt: new Date(Date.now() + 60_000),
      } as never);
      vi.mocked(bcryptjs.genSalt).mockResolvedValue("salt" as never);
      vi.mocked(bcryptjs.hash).mockResolvedValue("new-hashed-password" as never);

      await resetPassword("newpass123", "raw-token");

      expect(updateUser).toHaveBeenCalledWith("user-1", {
        password: "new-hashed-password",
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
        refreshToken: null,
      });
    });
  });
});
