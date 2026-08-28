import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/report.service.js", () => ({
  createReportForUser: vi.fn(),
  SelfReportError: class SelfReportError extends Error {},
  DuplicateReportError: class DuplicateReportError extends Error {},
  ReportRateLimitError: class ReportRateLimitError extends Error {},
}));

import {
  createReportForUser,
  SelfReportError,
  DuplicateReportError,
  ReportRateLimitError,
} from "../services/report.service.js";
import reportRouter from "./report.routes.js";

const buildApp = (userId: string) => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = userId;
    next();
  });
  app.use("/api/reports", reportRouter);
  return app;
};

describe("report.routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST / creates a post report and returns 201", async () => {
    vi.mocked(createReportForUser).mockResolvedValue({ id: "report-1" } as never);
    const app = buildApp("user-1");

    const res = await request(app)
      .post("/api/reports")
      .send({ targetType: "post", postId: "post-1", reason: "spam" });

    expect(res.status).toBe(201);
    expect(createReportForUser).toHaveBeenCalledWith(
      expect.objectContaining({ reporterId: "user-1", targetType: "post", postId: "post-1", reason: "spam" }),
    );
  });

  it("POST / returns 400 for an unrecognized reason", async () => {
    const app = buildApp("user-1");

    const res = await request(app)
      .post("/api/reports")
      .send({ targetType: "post", postId: "post-1", reason: "not-a-real-reason" });

    expect(res.status).toBe(400);
    expect(createReportForUser).not.toHaveBeenCalled();
  });

  it("POST / returns 400 when the target-specific id is missing for the given targetType", async () => {
    const app = buildApp("user-1");

    const res = await request(app)
      .post("/api/reports")
      .send({ targetType: "post", reason: "spam" });

    expect(res.status).toBe(400);
    expect(createReportForUser).not.toHaveBeenCalled();
  });

  it("POST / returns 400 with the service message for a self-report", async () => {
    vi.mocked(createReportForUser).mockRejectedValue(new SelfReportError("You cannot report yourself"));
    const app = buildApp("user-1");

    const res = await request(app)
      .post("/api/reports")
      .send({ targetType: "user_profile", reportedUserId: "user-1", reason: "spam" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("You cannot report yourself");
  });

  it("POST / returns 409 for a duplicate pending report", async () => {
    vi.mocked(createReportForUser).mockRejectedValue(new DuplicateReportError("Already reported"));
    const app = buildApp("user-1");

    const res = await request(app)
      .post("/api/reports")
      .send({ targetType: "post", postId: "post-1", reason: "spam" });

    expect(res.status).toBe(409);
  });

  it("POST / returns 429 once the reporter hits the daily cap", async () => {
    vi.mocked(createReportForUser).mockRejectedValue(new ReportRateLimitError("Too many reports"));
    const app = buildApp("user-1");

    const res = await request(app)
      .post("/api/reports")
      .send({ targetType: "post", postId: "post-1", reason: "spam" });

    expect(res.status).toBe(429);
  });
});
