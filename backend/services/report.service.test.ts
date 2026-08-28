import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/report.repository.js", () => ({
  createReport: vi.fn(),
  findPendingDuplicateReport: vi.fn(),
  countRecentReportsByReporter: vi.fn(),
  findReportById: vi.fn(),
  findReportsPage: vi.fn(),
  findReportedUsersSummary: vi.fn(),
  resolveReportRow: vi.fn(),
}));
vi.mock("../repository/post.repository.js", () => ({
  findPostForReport: vi.fn(),
  softDeletePost: vi.fn(),
}));
vi.mock("../repository/comment.repository.js", () => ({
  findCommentForReport: vi.fn(),
  softDeleteComment: vi.fn(),
}));
vi.mock("../repository/user.repository.js", () => ({
  findUserById: vi.fn(),
}));
vi.mock("../repository/admin.repository.js", () => ({
  blockUser: vi.fn(),
}));
vi.mock("./block.service.js", () => ({
  blockUser: vi.fn(),
}));
vi.mock("../repository/notification.repository.js", () => ({
  createNotification: vi.fn(),
  emitNewNotification: vi.fn(),
}));

import {
  createReport,
  findPendingDuplicateReport,
  countRecentReportsByReporter,
  findReportById,
  resolveReportRow,
} from "../repository/report.repository.js";
import { findPostForReport, softDeletePost } from "../repository/post.repository.js";
import { findCommentForReport, softDeleteComment } from "../repository/comment.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { blockUser as adminBlockUser } from "../repository/admin.repository.js";
import { blockUser as blockUserUser } from "./block.service.js";
import { createNotification, emitNewNotification } from "../repository/notification.repository.js";
import {
  createReportForUser,
  resolveReport,
  DuplicateReportError,
  InvalidReportActionError,
  ReportAlreadyResolvedError,
  ReportNotFoundError,
  ReportRateLimitError,
  SelfReportError,
  MAX_REPORTS_PER_DAY,
} from "./report.service.js";

const reporter = { id: "user-1", username: "alice" };

describe("createReportForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findUserById).mockResolvedValue(reporter as never);
    vi.mocked(countRecentReportsByReporter).mockResolvedValue(0);
    vi.mocked(findPendingDuplicateReport).mockResolvedValue(null);
    vi.mocked(createReport).mockResolvedValue({ id: "report-1" } as never);
  });

  it("throws when the reporter doesn't exist", async () => {
    vi.mocked(findUserById).mockResolvedValue(null);

    await expect(
      createReportForUser({
        reporterId: "user-1",
        targetType: "post",
        postId: "post-1",
        reason: "spam",
      }),
    ).rejects.toThrow("Reporter not found");
  });

  it("rejects once the reporter hits the daily report cap", async () => {
    vi.mocked(countRecentReportsByReporter).mockResolvedValue(MAX_REPORTS_PER_DAY);

    await expect(
      createReportForUser({
        reporterId: "user-1",
        targetType: "post",
        postId: "post-1",
        reason: "spam",
      }),
    ).rejects.toThrow(ReportRateLimitError);
    expect(createReport).not.toHaveBeenCalled();
  });

  it("builds a post snapshot and denormalizes reportedUserId from the post owner", async () => {
    vi.mocked(findPostForReport).mockResolvedValue({
      id: "post-1",
      userId: "user-2",
      title: "Title",
      body: "Body",
      imagesUrls: ["img.png"],
      user: { username: "bob" },
    } as never);

    await createReportForUser({
      reporterId: "user-1",
      targetType: "post",
      postId: "post-1",
      reason: "spam",
    });

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reporterId: "user-1",
        reporterUsername: "alice",
        reportedUserId: "user-2",
        targetType: "post",
        postId: "post-1",
        targetSnapshot: {
          title: "Title",
          body: "Body",
          imagesUrls: ["img.png"],
          authorUsername: "bob",
        },
      }),
    );
  });

  it("throws when the reported post doesn't exist", async () => {
    vi.mocked(findPostForReport).mockResolvedValue(null);

    await expect(
      createReportForUser({
        reporterId: "user-1",
        targetType: "post",
        postId: "missing",
        reason: "spam",
      }),
    ).rejects.toThrow("Post not found");
  });

  it("builds a comment snapshot and denormalizes reportedUserId from the comment owner", async () => {
    vi.mocked(findCommentForReport).mockResolvedValue({
      id: "comment-1",
      text: "some text",
      userId: "user-3",
      postId: "post-1",
      user: { username: "carol" },
    } as never);

    await createReportForUser({
      reporterId: "user-1",
      targetType: "comment",
      commentId: "comment-1",
      reason: "harassment_or_bullying",
    });

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportedUserId: "user-3",
        commentId: "comment-1",
        targetSnapshot: { text: "some text", authorUsername: "carol", postId: "post-1" },
      }),
    );
  });

  it("builds a profile snapshot directly from the reported user", async () => {
    vi.mocked(findUserById)
      .mockResolvedValueOnce(reporter as never)
      .mockResolvedValueOnce({
        id: "user-4",
        username: "dave",
        name: "Dave",
        bio: "bio",
        profilePicture: "pic.png",
      } as never);

    await createReportForUser({
      reporterId: "user-1",
      targetType: "user_profile",
      reportedUserId: "user-4",
      reason: "impersonation",
    });

    expect(createReport).toHaveBeenCalledWith(
      expect.objectContaining({
        reportedUserId: "user-4",
        targetType: "user_profile",
        targetSnapshot: { username: "dave", name: "Dave", bio: "bio", profilePicture: "pic.png" },
      }),
    );
  });

  it("rejects a self-report before creating anything", async () => {
    vi.mocked(findPostForReport).mockResolvedValue({
      id: "post-1",
      userId: "user-1",
      title: "t",
      body: null,
      imagesUrls: [],
      user: { username: "alice" },
    } as never);

    await expect(
      createReportForUser({
        reporterId: "user-1",
        targetType: "post",
        postId: "post-1",
        reason: "spam",
      }),
    ).rejects.toThrow(SelfReportError);
    expect(createReport).not.toHaveBeenCalled();
  });

  it("rejects a duplicate pending report on the same target", async () => {
    vi.mocked(findPostForReport).mockResolvedValue({
      id: "post-1",
      userId: "user-2",
      title: "t",
      body: null,
      imagesUrls: [],
      user: { username: "bob" },
    } as never);
    vi.mocked(findPendingDuplicateReport).mockResolvedValue({ id: "existing" } as never);

    await expect(
      createReportForUser({
        reporterId: "user-1",
        targetType: "post",
        postId: "post-1",
        reason: "spam",
      }),
    ).rejects.toThrow(DuplicateReportError);
    expect(createReport).not.toHaveBeenCalled();
  });

  it("also blocks the reported user when alsoBlock is set", async () => {
    vi.mocked(findPostForReport).mockResolvedValue({
      id: "post-1",
      userId: "user-2",
      title: "t",
      body: null,
      imagesUrls: [],
      user: { username: "bob" },
    } as never);

    await createReportForUser({
      reporterId: "user-1",
      targetType: "post",
      postId: "post-1",
      reason: "spam",
      alsoBlock: true,
    });

    expect(blockUserUser).toHaveBeenCalledWith({ authUserId: "user-1", targetUserId: "user-2" });
  });

  it("does not block when alsoBlock is omitted", async () => {
    vi.mocked(findPostForReport).mockResolvedValue({
      id: "post-1",
      userId: "user-2",
      title: "t",
      body: null,
      imagesUrls: [],
      user: { username: "bob" },
    } as never);

    await createReportForUser({
      reporterId: "user-1",
      targetType: "post",
      postId: "post-1",
      reason: "spam",
    });

    expect(blockUserUser).not.toHaveBeenCalled();
  });
});

describe("resolveReport", () => {
  const pendingPostReport = {
    id: "report-1",
    status: "pending",
    targetType: "post",
    postId: "post-1",
    commentId: null,
    reportedUserId: "user-2",
    reason: "spam",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveReportRow).mockResolvedValue({ id: "report-1", status: "resolved" } as never);
  });

  it("throws when the report doesn't exist", async () => {
    vi.mocked(findReportById).mockResolvedValue(null);

    await expect(
      resolveReport({ reportId: "missing", adminId: "admin-1", action: "dismiss" }),
    ).rejects.toThrow(ReportNotFoundError);
  });

  it("throws when the report was already resolved", async () => {
    vi.mocked(findReportById).mockResolvedValue({ ...pendingPostReport, status: "resolved" } as never);

    await expect(
      resolveReport({ reportId: "report-1", adminId: "admin-1", action: "dismiss" }),
    ).rejects.toThrow(ReportAlreadyResolvedError);
  });

  it("dismiss resolves with status=dismissed and action=none, no side effects", async () => {
    vi.mocked(findReportById).mockResolvedValue(pendingPostReport as never);

    await resolveReport({ reportId: "report-1", adminId: "admin-1", action: "dismiss", note: "not a violation" });

    expect(resolveReportRow).toHaveBeenCalledWith({
      id: "report-1",
      status: "dismissed",
      action: "none",
      reviewedByUserId: "admin-1",
      resolutionNote: "not a violation",
    });
    expect(softDeletePost).not.toHaveBeenCalled();
    expect(adminBlockUser).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it("remove_content rejects a profile-targeted report", async () => {
    vi.mocked(findReportById).mockResolvedValue({
      ...pendingPostReport,
      targetType: "user_profile",
      postId: null,
    } as never);

    await expect(
      resolveReport({ reportId: "report-1", adminId: "admin-1", action: "remove_content" }),
    ).rejects.toThrow(InvalidReportActionError);
    expect(resolveReportRow).not.toHaveBeenCalled();
  });

  it("remove_content on a post soft-deletes it, resolves, and notifies the owner", async () => {
    vi.mocked(findReportById).mockResolvedValue(pendingPostReport as never);

    await resolveReport({ reportId: "report-1", adminId: "admin-1", action: "remove_content", note: "spam" });

    expect(softDeletePost).toHaveBeenCalledWith({ postId: "post-1", reason: "spam", byUserId: "admin-1" });
    expect(softDeleteComment).not.toHaveBeenCalled();
    expect(resolveReportRow).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved", action: "content_removed" }),
    );
    expect(createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-2", type: "content-removed", postId: "post-1" }),
    );
    expect(emitNewNotification).toHaveBeenCalled();
  });

  it("remove_content on a comment soft-deletes the comment, not a post", async () => {
    vi.mocked(findReportById).mockResolvedValue({
      ...pendingPostReport,
      targetType: "comment",
      postId: null,
      commentId: "comment-1",
    } as never);

    await resolveReport({ reportId: "report-1", adminId: "admin-1", action: "remove_content" });

    expect(softDeleteComment).toHaveBeenCalledWith({ commentId: "comment-1", reason: undefined, byUserId: "admin-1" });
    expect(softDeletePost).not.toHaveBeenCalled();
  });

  it("remove_content still resolves and notifies when the content is already gone", async () => {
    vi.mocked(findReportById).mockResolvedValue({
      ...pendingPostReport,
      postId: null,
      commentId: null,
    } as never);

    await resolveReport({ reportId: "report-1", adminId: "admin-1", action: "remove_content" });

    expect(softDeletePost).not.toHaveBeenCalled();
    expect(softDeleteComment).not.toHaveBeenCalled();
    expect(resolveReportRow).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved", action: "content_removed" }),
    );
  });

  it("block_user rejects blocking yourself", async () => {
    vi.mocked(findReportById).mockResolvedValue({
      ...pendingPostReport,
      reportedUserId: "admin-1",
    } as never);

    await expect(
      resolveReport({ reportId: "report-1", adminId: "admin-1", action: "block_user" }),
    ).rejects.toThrow(InvalidReportActionError);
    expect(adminBlockUser).not.toHaveBeenCalled();
  });

  it("block_user rejects blocking another admin", async () => {
    vi.mocked(findReportById).mockResolvedValue(pendingPostReport as never);
    vi.mocked(findUserById).mockResolvedValue({ id: "user-2", role: "admin" } as never);

    await expect(
      resolveReport({ reportId: "report-1", adminId: "admin-1", action: "block_user" }),
    ).rejects.toThrow(InvalidReportActionError);
    expect(adminBlockUser).not.toHaveBeenCalled();
  });

  it("block_user resolves via the platform-ban path and does not send a duplicate notification", async () => {
    vi.mocked(findReportById).mockResolvedValue(pendingPostReport as never);
    vi.mocked(findUserById).mockResolvedValue({ id: "user-2", role: "user" } as never);

    await resolveReport({ reportId: "report-1", adminId: "admin-1", action: "block_user", note: "repeat offender" });

    expect(adminBlockUser).toHaveBeenCalledWith({
      userId: "user-2",
      blockedByUserId: "admin-1",
      reason: "repeat offender",
    });
    expect(resolveReportRow).toHaveBeenCalledWith(
      expect.objectContaining({ status: "resolved", action: "user_blocked" }),
    );
    expect(createNotification).not.toHaveBeenCalled();
  });
});
