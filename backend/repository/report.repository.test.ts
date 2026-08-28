import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    report: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "../database/prisma.js";
import {
  countPendingReports,
  countRecentReportsByReporter,
  createReport,
  findPendingDuplicateReport,
  findReportedUsersSummary,
  findReportsPage,
  resolveReportRow,
} from "./report.repository.js";

describe("report.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findPendingDuplicateReport", () => {
    it("keys the lookup on postId for a post report", async () => {
      await findPendingDuplicateReport({
        reporterId: "user-1",
        targetType: "post",
        postId: "post-1",
      });

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: { reporterId: "user-1", targetType: "post", status: "pending", postId: "post-1" },
      });
    });

    it("keys the lookup on reportedUserId for a profile report (postId is always null there)", async () => {
      await findPendingDuplicateReport({
        reporterId: "user-1",
        targetType: "user_profile",
        reportedUserId: "user-2",
      });

      expect(prisma.report.findFirst).toHaveBeenCalledWith({
        where: {
          reporterId: "user-1",
          targetType: "user_profile",
          status: "pending",
          reportedUserId: "user-2",
        },
      });
    });
  });

  it("countRecentReportsByReporter counts reports created within the given window", async () => {
    vi.mocked(prisma.report.count).mockResolvedValue(3);

    const result = await countRecentReportsByReporter("user-1", 1000 * 60 * 60 * 24);

    expect(result).toBe(3);
    expect(prisma.report.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { reporterId: "user-1", createdAt: { gte: expect.any(Date) } },
      }),
    );
  });

  it("createReport persists the report with a denormalized reportedUserId", async () => {
    vi.mocked(prisma.report.create).mockResolvedValue({ id: "report-1" } as never);

    await createReport({
      reporterId: "user-1",
      reporterUsername: "alice",
      reportedUserId: "user-2",
      targetType: "post",
      postId: "post-1",
      targetSnapshot: { title: "Hello" },
      reason: "spam",
    });

    expect(prisma.report.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          reporterId: "user-1",
          reporterUsername: "alice",
          reportedUserId: "user-2",
          targetType: "post",
          postId: "post-1",
          targetSnapshot: { title: "Hello" },
          reason: "spam",
        }),
      }),
    );
  });

  describe("findReportsPage", () => {
    it("applies status/reason/targetType filters when provided", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([]);

      await findReportsPage({ status: "pending", reason: "spam", targetType: "post", limit: 20 });

      expect(prisma.report.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "pending", reason: "spam", targetType: "post" },
        }),
      );
    });

    it("trims the lookahead row and reports hasMore/nextCursor", async () => {
      vi.mocked(prisma.report.findMany).mockResolvedValue([
        { id: "1" },
        { id: "2" },
      ] as never);

      const page = await findReportsPage({ limit: 1 });

      expect(page).toEqual({ reports: [{ id: "1" }], nextCursor: "1", hasMore: true });
    });
  });

  it("countPendingReports counts only pending reports", async () => {
    vi.mocked(prisma.report.count).mockResolvedValue(5);

    const result = await countPendingReports();

    expect(result).toBe(5);
    expect(prisma.report.count).toHaveBeenCalledWith({ where: { status: "pending" } });
  });

  it("resolveReportRow stamps reviewedAt and the resolving admin", async () => {
    vi.mocked(prisma.report.update).mockResolvedValue({ id: "report-1" } as never);

    await resolveReportRow({
      id: "report-1",
      status: "resolved",
      action: "content_removed",
      reviewedByUserId: "admin-1",
      resolutionNote: "removed for spam",
    });

    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "report-1" },
        data: expect.objectContaining({
          status: "resolved",
          action: "content_removed",
          reviewedByUserId: "admin-1",
          reviewedAt: expect.any(Date),
          resolutionNote: "removed for spam",
        }),
      }),
    );
  });

  describe("findReportedUsersSummary", () => {
    it("joins grouped counts back to user rows, dropping any user that no longer exists", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        { reportedUserId: "user-1", pendingCount: 3n, lastReportedAt: new Date("2026-01-01") },
        { reportedUserId: "user-2", pendingCount: 1n, lastReportedAt: new Date("2026-01-02") },
      ] as never);
      vi.mocked(prisma.user.findMany).mockResolvedValue([
        { id: "user-1", username: "alice" },
      ] as never);

      const result = await findReportedUsersSummary();

      expect(result).toEqual([
        {
          user: { id: "user-1", username: "alice" },
          pendingCount: 3,
          lastReportedAt: new Date("2026-01-01"),
        },
      ]);
    });

    it("short-circuits without a user lookup when there are no grouped rows", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([]);

      const result = await findReportedUsersSummary();

      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });
});
