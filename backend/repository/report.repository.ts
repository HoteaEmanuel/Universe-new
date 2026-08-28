import { prisma } from "../database/prisma.js";
import { userNameSearchClause } from "../lib/userSearchClause.js";
import { reportReasonEnum } from "../schemas/report.schema.js";
import type {
  Prisma,
  ReportTargetType,
  ReportReason,
  ReportStatus,
  ReportAction,
} from "../generated/prisma/client.js";

const REPORT_USER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  name: true,
  profilePicture: true,
} as const;

const REPORT_INCLUDE = {
  reporter: { select: REPORT_USER_SELECT },
  reportedUser: { select: REPORT_USER_SELECT },
  reviewedBy: { select: REPORT_USER_SELECT },
} satisfies Prisma.ReportInclude;

interface ReportPage<T> {
  reports: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const toReportPage = <T extends { id: string }>(
  rows: T[],
  limit: number,
): ReportPage<T> => {
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    reports: page,
    nextCursor: hasMore ? page[page.length - 1].id : null,
    hasMore,
  };
};

interface FindPendingDuplicateInput {
  reporterId: string;
  targetType: ReportTargetType;
  postId?: string;
  commentId?: string;
  reportedUserId?: string;
}

// Postgres treats NULL as distinct from NULL, so a @@unique constraint on
// (reporterId, postId) would never catch duplicate profile reports (postId
// is always null there). Doing the check here in the service/repository
// layer instead of the DB sidesteps that trap for every target type.
export const findPendingDuplicateReport = async (input: FindPendingDuplicateInput) => {
  const { reporterId, targetType, postId, commentId, reportedUserId } = input;
  return prisma.report.findFirst({
    where: {
      reporterId,
      targetType,
      status: "pending",
      ...(postId ? { postId } : {}),
      ...(commentId ? { commentId } : {}),
      ...(targetType === "user_profile" ? { reportedUserId } : {}),
    },
  });
};

export const countRecentReportsByReporter = async (reporterId: string, sinceMs: number) => {
  return prisma.report.count({
    where: { reporterId, createdAt: { gte: new Date(Date.now() - sinceMs) } },
  });
};

interface CreateReportInput {
  reporterId: string;
  reporterUsername: string;
  reportedUserId: string;
  targetType: ReportTargetType;
  postId?: string;
  commentId?: string;
  targetSnapshot: Prisma.InputJsonValue;
  reason: ReportReason;
  details?: string;
}

export const createReport = async (data: CreateReportInput) => {
  return prisma.report.create({
    data: {
      reporterId: data.reporterId,
      reporterUsername: data.reporterUsername,
      reportedUserId: data.reportedUserId,
      targetType: data.targetType,
      postId: data.postId,
      commentId: data.commentId,
      targetSnapshot: data.targetSnapshot,
      reason: data.reason,
      details: data.details,
    },
    include: REPORT_INCLUDE,
  });
};

export const findReportById = async (id: string) => {
  return prisma.report.findUnique({ where: { id }, include: REPORT_INCLUDE });
};

export interface ListReportsFilters {
  status?: ReportStatus;
  reason?: ReportReason;
  targetType?: ReportTargetType;
  search?: string;
  cursor?: string;
  limit: number;
}

// A free-text search matches either the reported user's name/username or the
// report's reason (e.g. typing "spam" or "harass" narrows to those reasons),
// since admins scanning the queue don't reliably know a reporter's exact
// enum label going in.
const reportSearchClause = (search: string): Prisma.ReportWhereInput => {
  const term = search.toLowerCase();
  const matchingReasons = reportReasonEnum.options.filter((value) =>
    value.replace(/_/g, " ").toLowerCase().includes(term),
  );
  return {
    OR: [
      { reportedUser: userNameSearchClause(search) },
      ...(matchingReasons.length ? [{ reason: { in: matchingReasons } }] : []),
    ],
  };
};

export const findReportsPage = async (filters: ListReportsFilters) => {
  const { status, reason, targetType, search, cursor, limit } = filters;
  const trimmedSearch = search?.trim();
  const rows = await prisma.report.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(reason ? { reason } : {}),
      ...(targetType ? { targetType } : {}),
      ...(trimmedSearch ? reportSearchClause(trimmedSearch) : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: REPORT_INCLUDE,
  });
  return toReportPage(rows, limit);
};

interface ReportedUserSummaryRow {
  reportedUserId: string;
  pendingCount: bigint;
  lastReportedAt: Date;
}

// Grouped "who's being reported most" view - a flat report list makes a
// repeat offender invisible among one-off reports scattered through the
// feed, so the admin queue needs this alongside findReportsPage.
export const findReportedUsersSummary = async (limit = 10) => {
  const rows = await prisma.$queryRaw<ReportedUserSummaryRow[]>`
    SELECT "reportedUserId", count(*) AS "pendingCount", max("createdAt") AS "lastReportedAt"
    FROM reports
    WHERE status = 'pending'
    GROUP BY "reportedUserId"
    ORDER BY count(*) DESC, max("createdAt") DESC
    LIMIT ${limit}
  `;
  const userIds = rows.map((row) => row.reportedUserId);
  if (userIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: REPORT_USER_SELECT,
  });
  const userById = new Map(users.map((user) => [user.id, user]));

  return rows
    .map((row) => ({
      user: userById.get(row.reportedUserId) ?? null,
      pendingCount: Number(row.pendingCount),
      lastReportedAt: row.lastReportedAt,
    }))
    .filter((row) => row.user !== null);
};

export const countPendingReports = async () => prisma.report.count({ where: { status: "pending" } });

interface ResolveReportInput {
  id: string;
  status: ReportStatus;
  action: ReportAction;
  reviewedByUserId: string;
  resolutionNote?: string;
}

export const resolveReportRow = async (data: ResolveReportInput) => {
  return prisma.report.update({
    where: { id: data.id },
    data: {
      status: data.status,
      action: data.action,
      reviewedByUserId: data.reviewedByUserId,
      reviewedAt: new Date(),
      resolutionNote: data.resolutionNote,
    },
    include: REPORT_INCLUDE,
  });
};
