import {
  createReport,
  findPendingDuplicateReport,
  countRecentReportsByReporter,
  findReportById,
  findReportsPage,
  findReportedUsersSummary,
  resolveReportRow,
  type ListReportsFilters,
} from "../repository/report.repository.js";
import { findPostForReport, softDeletePost } from "../repository/post.repository.js";
import { findCommentForReport, softDeleteComment } from "../repository/comment.repository.js";
import { findUserById } from "../repository/user.repository.js";
import { blockUser as adminBlockUser } from "../repository/admin.repository.js";
import { blockUser as blockUserUser } from "./block.service.js";
import { createNotification, emitNewNotification } from "../repository/notification.repository.js";
import type { Prisma } from "../generated/prisma/client.js";
import type {
  CreateReportInput as CreateReportSchemaInput,
  ResolveReportInput as ResolveReportSchemaInput,
} from "../schemas/report.schema.js";

export class SelfReportError extends Error {}
export class DuplicateReportError extends Error {}
export class ReportRateLimitError extends Error {}
export class ReportNotFoundError extends Error {}
export class ReportAlreadyResolvedError extends Error {}
export class InvalidReportActionError extends Error {}

export const MAX_REPORTS_PER_DAY = 20;
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

type CreateReportServiceInput = CreateReportSchemaInput & { reporterId: string };

export const createReportForUser = async (input: CreateReportServiceInput) => {
  const { reporterId, reason, details, alsoBlock } = input;

  const reporter = await findUserById(reporterId);
  if (!reporter) throw new Error("Reporter not found");

  const recentCount = await countRecentReportsByReporter(reporterId, ONE_DAY_MS);
  if (recentCount >= MAX_REPORTS_PER_DAY) {
    throw new ReportRateLimitError(
      "You've filed too many reports today. Please try again tomorrow.",
    );
  }

  let reportedUserId: string;
  let postId: string | undefined;
  let commentId: string | undefined;
  let targetSnapshot: Prisma.InputJsonValue;

  if (input.targetType === "post") {
    const post = await findPostForReport(input.postId);
    if (!post) throw new Error("Post not found");
    reportedUserId = post.userId;
    postId = post.id;
    targetSnapshot = {
      title: post.title,
      body: post.body,
      imagesUrls: post.imagesUrls,
      authorUsername: post.user.username,
    };
  } else if (input.targetType === "comment") {
    const comment = await findCommentForReport(input.commentId);
    if (!comment) throw new Error("Comment not found");
    reportedUserId = comment.userId;
    commentId = comment.id;
    targetSnapshot = {
      text: comment.text,
      authorUsername: comment.user.username,
      postId: comment.postId,
    };
  } else {
    const target = await findUserById(input.reportedUserId);
    if (!target) throw new Error("User not found");
    reportedUserId = target.id;
    targetSnapshot = {
      username: target.username,
      name: target.name,
      bio: target.bio,
      profilePicture: target.profilePicture,
    };
  }

  if (reportedUserId === reporterId) {
    throw new SelfReportError("You cannot report yourself");
  }

  const duplicate = await findPendingDuplicateReport({
    reporterId,
    targetType: input.targetType,
    postId,
    commentId,
    reportedUserId: input.targetType === "user_profile" ? reportedUserId : undefined,
  });
  if (duplicate) {
    throw new DuplicateReportError("You already have a pending report for this");
  }

  const report = await createReport({
    reporterId,
    reporterUsername: reporter.username,
    reportedUserId,
    targetType: input.targetType,
    postId,
    commentId,
    targetSnapshot,
    reason,
    details,
  });

  if (alsoBlock) {
    await blockUserUser({ authUserId: reporterId, targetUserId: reportedUserId });
  }

  return report;
};

export const listReports = async (filters: ListReportsFilters) => findReportsPage(filters);

export const getReportDetail = async (id: string) => {
  const report = await findReportById(id);
  if (!report) throw new ReportNotFoundError("Report not found");
  return report;
};

export const getReportedUsersSummary = async (limit?: number) =>
  findReportedUsersSummary(limit);

interface ResolveReportServiceInput extends ResolveReportSchemaInput {
  reportId: string;
  adminId: string;
}

const notifyReportedUser = async (params: {
  reportedUserId: string;
  actionUserId: string;
  message: string;
  postId?: string | null;
  commentId?: string | null;
}) => {
  const notification = await createNotification({
    userId: params.reportedUserId,
    actionUserId: params.actionUserId,
    type: "content-removed",
    message: params.message,
    postId: params.postId ?? undefined,
    commentId: params.commentId ?? undefined,
  });
  await emitNewNotification(params.reportedUserId, notification);
};

export const resolveReport = async (input: ResolveReportServiceInput) => {
  const { reportId, adminId, action, note } = input;

  const report = await findReportById(reportId);
  if (!report) throw new ReportNotFoundError("Report not found");
  if (report.status !== "pending") {
    throw new ReportAlreadyResolvedError("This report has already been resolved");
  }

  if (action === "dismiss") {
    return resolveReportRow({
      id: reportId,
      status: "dismissed",
      action: "none",
      reviewedByUserId: adminId,
      resolutionNote: note,
    });
  }

  if (action === "remove_content") {
    if (report.targetType === "user_profile") {
      throw new InvalidReportActionError(
        "Cannot remove content for a profile report - block the user instead",
      );
    }
    // Content may already be gone (the reported user deleted it before
    // review) - the snapshot is what admins actually reviewed, so still
    // resolve the report even if there's nothing left to soft-delete.
    if (report.postId) {
      await softDeletePost({ postId: report.postId, reason: note, byUserId: adminId });
    } else if (report.commentId) {
      await softDeleteComment({ commentId: report.commentId, reason: note, byUserId: adminId });
    }

    const resolved = await resolveReportRow({
      id: reportId,
      status: "resolved",
      action: "content_removed",
      reviewedByUserId: adminId,
      resolutionNote: note,
    });
    await notifyReportedUser({
      reportedUserId: report.reportedUserId,
      actionUserId: adminId,
      message: "Your content was removed for violating community guidelines.",
      postId: report.postId,
      commentId: report.commentId,
    });
    return resolved;
  }

  // action === "block_user" - reuses the platform-ban path (UserAccountStatus),
  // not the user-to-user Block model. Mirrors admin.controller's blockUser
  // safety checks since this reaches the same repository function via a
  // different route.
  if (report.reportedUserId === adminId) {
    throw new InvalidReportActionError("You cannot block yourself");
  }
  const targetUser = await findUserById(report.reportedUserId);
  if (targetUser?.role === "admin") {
    throw new InvalidReportActionError("Admins cannot block other admins");
  }

  await adminBlockUser({
    userId: report.reportedUserId,
    blockedByUserId: adminId,
    reason: note ?? `Reported for ${report.reason}`,
  });

  return resolveReportRow({
    id: reportId,
    status: "resolved",
    action: "user_blocked",
    reviewedByUserId: adminId,
    resolutionNote: note,
  });
};
