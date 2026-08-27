import { prisma } from "../database/prisma.js";
import { userNameSearchClause } from "../lib/userSearchClause.js";

export const ADMIN_USER_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  name: true,
  email: true,
  profilePicture: true,
  role: true,
  accountType: true,
  createdAt: true,
} as const;

interface FindUsersPageInput {
  cursor?: string;
  search?: string;
  limit: number;
}

export const findUsersPage = async ({ cursor, search, limit }: FindUsersPageInput) => {
  const rows = await prisma.user.findMany({
    where: search ? userNameSearchClause(search) : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      ...ADMIN_USER_SELECT,
      accountStatus: { select: { status: true, reason: true, blockedAt: true } },
    },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    items: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    hasMore,
  };
};

interface BlockUserInput {
  userId: string;
  blockedByUserId: string;
  reason?: string;
}

// Plain (non-serializable) transaction: just atomicity for the two writes
// below, so a crash between them can't leave refreshToken nulled without a
// status row (or vice versa). Not meant to close the race against a login
// happening in the same instant — see PR discussion; that residual window
// is the same accepted tradeoff as the ~15 min refresh-rotation delay.
export const blockUser = async ({ userId, blockedByUserId, reason }: BlockUserInput) =>
  prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { refreshToken: null } });
    return tx.userAccountStatus.upsert({
      where: { userId },
      create: {
        userId,
        status: "blocked",
        reason,
        blockedAt: new Date(),
        blockedByUserId,
        blockedEmailSentAt: null,
      },
      update: {
        status: "blocked",
        reason,
        blockedAt: new Date(),
        blockedByUserId,
        blockedEmailSentAt: null,
      },
    });
  });

export const unblockUser = async (userId: string) =>
  prisma.userAccountStatus.update({
    where: { userId },
    data: {
      status: "active",
      reason: null,
      blockedAt: null,
      blockedByUserId: null,
      blockedEmailSentAt: null,
    },
  });

// Users whose block has stood for at least `minAgeMs` and who haven't been
// emailed yet. Waiting before emailing means a still-blocked-but-not-yet-
// kicked user (residual ~15 min access token window, see rotateRefreshToken)
// doesn't get advance notice they're about to lose access.
export const findPendingBlockedAccountEmails = async (minAgeMs: number) =>
  prisma.userAccountStatus.findMany({
    where: {
      status: "blocked",
      blockedEmailSentAt: null,
      blockedAt: { lte: new Date(Date.now() - minAgeMs) },
    },
    include: { user: true },
  });

export const markBlockedAccountEmailSent = async (userId: string) =>
  prisma.userAccountStatus.updateMany({
    where: { userId, status: "blocked", blockedEmailSentAt: null },
    data: { blockedEmailSentAt: new Date() },
  });

const ONE_WEEK_MS = 1000 * 60 * 60 * 24 * 7;

export const findAdminStats = async () => {
  const [
    totalUsers,
    newUsersThisWeek,
    blockedUsers,
    pendingBusinessRegistrations,
    businessAccounts,
    totalPosts,
    totalGroups,
    totalEvents,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - ONE_WEEK_MS) } },
    }),
    prisma.userAccountStatus.count({ where: { status: "blocked" } }),
    prisma.user.count({
      where: { accountType: "business", identityVerified: "false" },
    }),
    prisma.user.count({ where: { accountType: "business" } }),
    prisma.post.count(),
    prisma.group.count(),
    prisma.event.count(),
  ]);

  return {
    totalUsers,
    newUsersThisWeek,
    blockedUsers,
    activeUsers: totalUsers - blockedUsers,
    pendingBusinessRegistrations,
    businessAccounts,
    totalPosts,
    totalGroups,
    totalEvents,
  };
};

interface UniversityCountRow {
  university: string;
  count: bigint;
}

// Top universities by user count. Raw SQL because Prisma's groupBy can't
// order by aggregate + limit in one call without a separate count query.
export const findTopUniversities = async (limit: number) => {
  const rows = await prisma.$queryRaw<UniversityCountRow[]>`
    SELECT university, count(*) AS count
    FROM users
    WHERE university IS NOT NULL
    GROUP BY university
    ORDER BY count DESC
    LIMIT ${limit};
  `;
  return rows.map((row) => ({ university: row.university, count: Number(row.count) }));
};

interface DailyActivityRow {
  date: string;
  newUsers: bigint;
  newPosts: bigint;
}

// Zero-filled daily counts for the trailing `days` days (including today), via
// generate_series so days with no signups/posts still appear as 0 instead of
// being absent from the series.
export const findDailyActivity = async (days: number) => {
  const rows = await prisma.$queryRaw<DailyActivityRow[]>`
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS date,
      COALESCE(u.count, 0) AS "newUsers",
      COALESCE(p.count, 0) AS "newPosts"
    FROM generate_series(
      (CURRENT_DATE - (${days - 1} || ' days')::interval),
      CURRENT_DATE,
      interval '1 day'
    ) AS d(day)
    LEFT JOIN (
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
      FROM users
      WHERE "createdAt" >= (CURRENT_DATE - (${days - 1} || ' days')::interval)
      GROUP BY 1
    ) u ON u.day = d.day
    LEFT JOIN (
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
      FROM posts
      WHERE "createdAt" >= (CURRENT_DATE - (${days - 1} || ' days')::interval)
      GROUP BY 1
    ) p ON p.day = d.day
    ORDER BY d.day;
  `;
  return rows.map((row) => ({
    date: row.date,
    newUsers: Number(row.newUsers),
    newPosts: Number(row.newPosts),
  }));
};
