import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: { user: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() } },
}));
vi.mock("../services/auth.service.js", () => ({
  login: vi.fn(),
  signUp: vi.fn(),
  verifyEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock("../utils/generateTokenJwt.js", () => ({
  generateToken: vi.fn(),
}));
vi.mock("../utils/generateJwtMobile.js", () => ({
  generateJwtMobile: vi.fn(),
}));
vi.mock("../repository/user.repository.js", () => ({
  PUBLIC_USER_SELECT: {},
  createUserWithGeneratedUsername: vi.fn(),
  findUserById: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("../lib/oauthExchange.js", () => ({
  createMobileAuthExchangeCode: vi.fn(),
  consumeMobileAuthExchangeCode: vi.fn(),
}));
vi.mock("../services/refreshToken.service.js", async () => {
  const actual = await vi.importActual<typeof import("../services/refreshToken.service.js")>(
    "../services/refreshToken.service.js",
  );
  return {
    RefreshTokenReuseError: actual.RefreshTokenReuseError,
    rotateRefreshToken: vi.fn(),
  };
});

import { signRefreshToken } from "../lib/authTokens.js";
import { updateUser } from "../repository/user.repository.js";
import { RefreshTokenReuseError, rotateRefreshToken } from "../services/refreshToken.service.js";
import {
  forgotPassword,
  login,
  resetPassword,
  sendVerificationEmail,
  signUp,
  verifyEmail,
} from "../services/auth.service.js";
import { generateJwtMobile } from "../utils/generateJwtMobile.js";
import { generateToken } from "../utils/generateTokenJwt.js";
import authRouter from "./auth.routes.js";

beforeAll(() => {
  process.env.JWT_KEY = "test-jwt-secret";
});

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  return app;
};

describe("auth.routes", () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe("POST /signup", () => {
    it("creates a user for a valid normal signup body", async () => {
      vi.mocked(signUp).mockResolvedValue({ id: "user-1" } as never);

      const res = await request(app).post("/api/auth/signup").send({
        accountType: "normal",
        email: "jane@unibuc.ro",
        password: "secret123",
      });

      expect(res.status).toBe(201);
      expect(res.body.user).toEqual({ id: "user-1" });
    });

    it("rejects an invalid body without calling the service", async () => {
      const res = await request(app).post("/api/auth/signup").send({
        accountType: "normal",
        email: "not-an-email",
        password: "secret123",
      });

      expect(res.status).toBe(400);
      expect(signUp).not.toHaveBeenCalled();
    });

    it("returns the service's error message on failure", async () => {
      vi.mocked(signUp).mockRejectedValue(new Error("Registration failed"));

      const res = await request(app).post("/api/auth/signup").send({
        accountType: "normal",
        email: "jane@unibuc.ro",
        password: "secret123",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Registration failed");
    });
  });

  describe("POST /verify-email", () => {
    it("verifies successfully", async () => {
      vi.mocked(verifyEmail).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/auth/verify-email")
        .send({ email: "jane@unibuc.ro", verificationCode: "123456" });

      expect(res.status).toBe(200);
    });

    it("surfaces the service error on a wrong code", async () => {
      vi.mocked(verifyEmail).mockRejectedValue(new Error("Verification code is wrong"));

      const res = await request(app)
        .post("/api/auth/verify-email")
        .send({ email: "jane@unibuc.ro", verificationCode: "000000" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Verification code is wrong");
    });
  });

  describe("POST /resend-verify-email", () => {
    it("calls the service and returns 200", async () => {
      vi.mocked(sendVerificationEmail).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/auth/resend-verify-email")
        .send({ email: "jane@unibuc.ro" });

      expect(res.status).toBe(200);
      expect(sendVerificationEmail).toHaveBeenCalledWith("jane@unibuc.ro");
    });
  });

  describe("POST /login", () => {
    it("logs in and sets auth cookies via generateToken", async () => {
      vi.mocked(login).mockResolvedValue({ id: "user-1" } as never);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "jane@unibuc.ro", password: "secret123" });

      expect(res.status).toBe(200);
      expect(generateToken).toHaveBeenCalledWith(expect.anything(), "user-1");
    });

    it("returns 400 with the service's error message on failed auth", async () => {
      vi.mocked(login).mockRejectedValue(new Error("Authentication failed"));

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "jane@unibuc.ro", password: "wrong" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Authentication failed");
    });
  });

  describe("POST /login/mobile", () => {
    it("returns stringified access/refresh tokens on success", async () => {
      vi.mocked(login).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(generateJwtMobile).mockResolvedValue({
        accessToken: "access-1",
        refreshToken: "refresh-1",
      });

      const res = await request(app)
        .post("/api/auth/login/mobile")
        .send({ email: "jane@unibuc.ro", password: "secret123" });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe(JSON.stringify("access-1"));
      expect(res.body.refreshToken).toBe(JSON.stringify("refresh-1"));
    });

    it("returns a generic 400 if token generation fails, hiding the real error", async () => {
      vi.mocked(login).mockResolvedValue({ id: "user-1" } as never);
      vi.mocked(generateJwtMobile).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/auth/login/mobile")
        .send({ email: "jane@unibuc.ro", password: "secret123" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Could not log in");
    });
  });

  describe("POST /forgot-password", () => {
    it("returns 200 on success", async () => {
      vi.mocked(forgotPassword).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "jane@unibuc.ro" });

      expect(res.status).toBe(200);
    });

    it("returns a generic 400 message regardless of the underlying error", async () => {
      vi.mocked(forgotPassword).mockRejectedValue(new Error("User not found with provided email"));

      const res = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "jane@unibuc.ro" });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Couldnt reset password");
    });
  });

  describe("POST /reset-password/:token", () => {
    it("resets the password on success", async () => {
      vi.mocked(resetPassword).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/auth/reset-password/some-token")
        .send({ password: "newpassword123" });

      expect(res.status).toBe(200);
      expect(resetPassword).toHaveBeenCalledWith("newpassword123", "some-token");
    });

    it("surfaces the service's error message on failure", async () => {
      vi.mocked(resetPassword).mockRejectedValue(new Error("Reset link has expired, please request a new one"));

      const res = await request(app)
        .post("/api/auth/reset-password/expired-token")
        .send({ password: "newpassword123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Reset link has expired, please request a new one");
    });
  });

  describe("POST /logout", () => {
    it("clears cookies even with no refresh token present", async () => {
      const res = await request(app).post("/api/auth/logout").send({});

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]?.some((c: string) => c.startsWith("refreshToken=;"))).toBe(
        true,
      );
      expect(updateUser).not.toHaveBeenCalled();
    });

    it("revokes the stored refresh token hash when a valid refresh cookie is presented", async () => {
      vi.mocked(updateUser).mockResolvedValue({} as never);
      const refreshToken = signRefreshToken("user-1");

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", [`refreshToken=${refreshToken}`])
        .send({});

      expect(res.status).toBe(200);
      expect(updateUser).toHaveBeenCalledWith("user-1", { refreshToken: null });
    });
  });

  describe("POST /refresh-mobile", () => {
    it("returns rotated tokens on success", async () => {
      vi.mocked(rotateRefreshToken).mockResolvedValue({
        userId: "user-1",
        accessToken: "new-access",
        refreshToken: "new-refresh",
      });

      const res = await request(app)
        .post("/api/auth/refresh-mobile")
        .send({ refreshToken: "some-refresh-token" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ accessToken: "new-access", refreshToken: "new-refresh" });
    });

    it("returns 401 on refresh token reuse", async () => {
      vi.mocked(rotateRefreshToken).mockRejectedValue(new RefreshTokenReuseError("Session expired"));

      const res = await request(app)
        .post("/api/auth/refresh-mobile")
        .send({ refreshToken: "stale-token" });

      expect(res.status).toBe(401);
    });

    it("rejects a body missing refreshToken before calling the service", async () => {
      const res = await request(app).post("/api/auth/refresh-mobile").send({});

      expect(res.status).toBe(400);
      expect(rotateRefreshToken).not.toHaveBeenCalled();
    });
  });
});
