import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// requireAdmin normally checks req.userId against the DB - bypassed here so
// this test can focus on the report-queue routes' own wiring/validation.
vi.mock("../middleware/authorization.js", () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock("../services/report.service.js", () => ({
  listReports: vi.fn(),
  getReportedUsersSummary: vi.fn(),
  getReportDetail: vi.fn(),
  resolveReport: vi.fn(),
  ReportNotFoundError: class ReportNotFoundError extends Error {},
  ReportAlreadyResolvedError: class ReportAlreadyResolvedError extends Error {},
  InvalidReportActionError: class InvalidReportActionError extends Error {},
}));

import {
  listReports,
  getReportedUsersSummary,
  getReportDetail,
  resolveReport,
  ReportNotFoundError,
  ReportAlreadyResolvedError,
  InvalidReportActionError,
} from "../services/report.service.js";
import adminRouter from "./admin.routes.js";

const buildApp = (userId = "admin-1") => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.userId = userId;
    next();
  });
  app.use("/api/admin", adminRouter);
  return app;
};

describe("admin.routes - report queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /reports lists reports with the parsed query filters", async () => {
    vi.mocked(listReports).mockResolvedValue({ reports: [], nextCursor: null, hasMore: false });
    const app = buildApp();

    const res = await request(app).get("/api/admin/reports?status=pending&limit=10");

    expect(res.status).toBe(200);
    expect(listReports).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", limit: 10 }),
    );
  });

  it("GET /reports/summary returns the grouped reported-user summary before hitting the :id route", async () => {
    vi.mocked(getReportedUsersSummary).mockResolvedValue([{ pendingCount: 2 }] as never);
    const app = buildApp();

    const res = await request(app).get("/api/admin/reports/summary");

    expect(res.status).toBe(200);
    expect(res.body.summary).toEqual([{ pendingCount: 2 }]);
    expect(getReportDetail).not.toHaveBeenCalled();
  });

  it("GET /reports/:id returns 404 when the report doesn't exist", async () => {
    vi.mocked(getReportDetail).mockRejectedValue(new ReportNotFoundError("Report not found"));
    const app = buildApp();

    const res = await request(app).get("/api/admin/reports/missing");

    expect(res.status).toBe(404);
  });

  it("POST /reports/:id/resolve rejects an unrecognized action", async () => {
    const app = buildApp();

    const res = await request(app)
      .post("/api/admin/reports/report-1/resolve")
      .send({ action: "not-a-real-action" });

    expect(res.status).toBe(400);
    expect(resolveReport).not.toHaveBeenCalled();
  });

  it("POST /reports/:id/resolve returns 409 when the report was already resolved", async () => {
    vi.mocked(resolveReport).mockRejectedValue(new ReportAlreadyResolvedError("Already resolved"));
    const app = buildApp();

    const res = await request(app)
      .post("/api/admin/reports/report-1/resolve")
      .send({ action: "dismiss" });

    expect(res.status).toBe(409);
  });

  it("POST /reports/:id/resolve returns 400 for an invalid action on this report's target type", async () => {
    vi.mocked(resolveReport).mockRejectedValue(
      new InvalidReportActionError("Cannot remove content for a profile report"),
    );
    const app = buildApp();

    const res = await request(app)
      .post("/api/admin/reports/report-1/resolve")
      .send({ action: "remove_content" });

    expect(res.status).toBe(400);
  });

  it("POST /reports/:id/resolve calls the service with the resolving admin's id", async () => {
    vi.mocked(resolveReport).mockResolvedValue({ id: "report-1", status: "resolved" } as never);
    const app = buildApp("admin-42");

    const res = await request(app)
      .post("/api/admin/reports/report-1/resolve")
      .send({ action: "block_user", note: "repeat offender" });

    expect(res.status).toBe(200);
    expect(resolveReport).toHaveBeenCalledWith({
      reportId: "report-1",
      adminId: "admin-42",
      action: "block_user",
      note: "repeat offender",
    });
  });
});
