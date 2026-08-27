import { prisma } from "../database/prisma.js";
import type {
  EventVisibility,
  EventParticipantStatus,
  Prisma,
} from "../generated/prisma/client.js";
import { getRelevantFirstPage } from "../lib/relevantFirstPage.js";
import { runSerializable } from "../lib/serializableTransaction.js";
import { userNameSearchClause } from "../lib/userSearchClause.js";
import { searchUsers } from "./search.repository.js";

export class EventBannedError extends Error {}

export const EVENT_CREATOR_SELECT = {
  id: true,
  username: true,
  firstName: true,
  lastName: true,
  name: true,
  profilePicture: true,
  accountType: true,
  identityVerified: true,
  university: true,
} as const;

const EVENT_HOST_GROUP_SELECT = {
  id: true,
  name: true,
  coverImageUrl: true,
} as const;

export const EVENT_INCLUDE = {
  creator: { select: EVENT_CREATOR_SELECT },
  hostGroup: { select: EVENT_HOST_GROUP_SELECT },
  coordinationGroup: { select: { id: true } },
  announcementPost: { select: { id: true } },
} satisfies Prisma.EventInclude;

const EVENT_LIST_ORDER_BY: Prisma.EventOrderByWithRelationInput[] = [
  { startAt: "asc" },
  { id: "asc" },
];

interface CreateEventInput {
  creatorId: string;
  hostGroupId?: string;
  title: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt: Date;
  endAt?: Date;
  visibility?: EventVisibility;
  capacity?: number;
}

export const createEvent = async (data: CreateEventInput) => {
  return prisma.event.create({ data, include: EVENT_INCLUDE });
};

export const findEventById = async (id: string) => {
  return prisma.event.findUnique({ where: { id }, include: EVENT_INCLUDE });
};

interface UpdateEventInput {
  title?: string;
  description?: string;
  location?: string;
  virtualUrl?: string;
  startAt?: Date;
  endAt?: Date;
  capacity?: number;
}

export const updateEvent = async (id: string, data: UpdateEventInput) => {
  return prisma.event.update({ where: { id }, data, include: EVENT_INCLUDE });
};

export const cancelEvent = async (id: string) => {
  return prisma.event.update({
    where: { id },
    data: { cancelledAt: new Date() },
    include: EVENT_INCLUDE,
  });
};

export const setEventCoverImage = async (
  id: string,
  coverImageUrl: string,
  coverImageKey: string,
) => {
  return prisma.event.update({
    where: { id },
    data: { coverImageUrl, coverImageKey },
  });
};

export const setEventCoordinationGroupId = async (
  id: string,
  groupId: string,
) => {
  return prisma.event.update({
    where: { id },
    data: { coordinationGroup: { connect: { id: groupId } } },
  });
};

export const createEventAnnouncementPost = async (event: {
  id: string;
  creatorId: string;
  title: string;
  description?: string | null;
  location?: string | null;
}) => {
  return prisma.post.create({
    data: {
      userId: event.creatorId,
      title: event.title,
      body: event.description,
      location: event.location,
      eventId: event.id,
    },
  });
};

const upcomingOrOngoingFilter = (): Prisma.EventWhereInput => ({
  OR: [
    { endAt: { gte: new Date() } },
    { endAt: null, startAt: { gte: new Date() } },
  ],
});

// Onboarding step 5 candidate pool: soonest upcoming public events created
// by someone at the viewer's university, capped at `limit`. Simpler than
// findDiscoverableEvents' relevance-first-page logic below since there's no
// connection graph to rank against yet for a brand-new user.
export const findUpcomingUniversityEvents = async (
  university: string,
  limit: number,
) => {
  return prisma.event.findMany({
    where: {
      visibility: "public",
      cancelledAt: null,
      creator: { university },
      ...upcomingOrOngoingFilter(),
    },
    orderBy: EVENT_LIST_ORDER_BY,
    include: EVENT_INCLUDE,
    take: limit,
  });
};

interface FindDiscoverableEventsInput {
  connectedUserIds: string[];
  cursor?: string;
  limit: number;
}

export const findDiscoverableEvents = async ({
  connectedUserIds,
  cursor,
  limit,
}: FindDiscoverableEventsInput) => {
  const baseWhere: Prisma.EventWhereInput = {
    visibility: "public",
    cancelledAt: null,
    ...upcomingOrOngoingFilter(),
  };
  const connectedGoingOrInterested: Prisma.EventWhereInput = {
    participants: {
      some: {
        userId: { in: connectedUserIds },
        status: { in: ["going", "interested"] },
      },
    },
  };

  return getRelevantFirstPage({
    cursor,
    limit,
    fetchRelevant: () => {
      if (connectedUserIds.length === 0) return Promise.resolve([]);
      return prisma.event.findMany({
        where: { ...baseWhere, ...connectedGoingOrInterested },
        orderBy: EVENT_LIST_ORDER_BY,
        include: EVENT_INCLUDE,
      });
    },
    fetchNonRelevant: (cursorId, take) => {
      return prisma.event.findMany({
        where:
          connectedUserIds.length > 0
            ? { ...baseWhere, NOT: connectedGoingOrInterested }
            : baseWhere,
        orderBy: EVENT_LIST_ORDER_BY,
        include: EVENT_INCLUDE,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
        take,
      });
    },
  });
};

interface FindMyEventsInput {
  userId: string;
  scope: "hosting" | "going" | "interested" | "waitlisted";
  cursor?: string;
  limit: number;
}

export const findMyEvents = async ({
  userId,
  scope,
  cursor,
  limit,
}: FindMyEventsInput) => {
  const where: Prisma.EventWhereInput =
    scope === "hosting"
      ? { creatorId: userId }
      : { participants: { some: { userId, status: scope } } };

  const events = await prisma.event.findMany({
    where,
    orderBy: EVENT_LIST_ORDER_BY,
    include: EVENT_INCLUDE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const hasMore = events.length > limit;
  const page = hasMore ? events.slice(0, limit) : events;
  return {
    items: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    hasMore,
  };
};

export const findEventParticipant = async (eventId: string, userId: string) => {
  return prisma.eventParticipant.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
};

export const countGoingParticipants = async (eventId: string) => {
  return prisma.eventParticipant.count({ where: { eventId, status: "going" } });
};

export const countParticipantsByStatus = async (eventId: string) => {
  const counts = await prisma.eventParticipant.groupBy({
    by: ["status"],
    where: { eventId },
    _count: true,
  });
  const result: Record<EventParticipantStatus, number> = {
    going: 0,
    interested: 0,
    waitlisted: 0,
  };
  counts.forEach((row) => {
    result[row.status] = row._count;
  });
  return result;
};

export const upsertEventParticipant = async (
  eventId: string,
  userId: string,
  status: EventParticipantStatus,
) => {
  return prisma.eventParticipant.upsert({
    where: { eventId_userId: { eventId, userId } },
    create: { eventId, userId, status },
    update: { status },
  });
};

// The one write path that's allowed to create/update an EventParticipant row.
// Every caller that can hand someone a participant row - RSVP, and waitlist
// auto-promotion in cancelRsvpService - must go through this instead of
// upsertEventParticipant directly, otherwise a banned user can regain a row
// through whichever path didn't get a ban check (see the Codex design review
// in current-feature.md: waitlist promotion was the original spec's blind
// spot). Runs serializable so a concurrent ban can't race past the check.
export const acquireEventParticipant = async (
  eventId: string,
  userId: string,
  status: EventParticipantStatus,
) => {
  return runSerializable(async (tx) => {
    const ban = await tx.eventBan.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (ban)
      throw new EventBannedError("You have been removed from this event");
    return tx.eventParticipant.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status },
      update: { status },
    });
  });
};

export const deleteEventParticipant = async (
  eventId: string,
  userId: string,
) => {
  return prisma.eventParticipant.delete({
    where: { eventId_userId: { eventId, userId } },
  });
};

export const findEventBan = async (eventId: string, userId: string) => {
  return prisma.eventBan.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
};

interface BanEventParticipantInput {
  eventId: string;
  userId: string;
  bannedByUserId: string;
  reason?: string;
  coordinationGroupId?: string;
}

// Kick + ban as one atomic action: drop any existing participant row and
// coordination-group membership, then record the ban - all under the same
// serializable transaction acquireEventParticipant checks against, so a
// concurrent RSVP can't slip in while the ban is being written.
export const banEventParticipant = async (data: BanEventParticipantInput) => {
  const { eventId, userId, bannedByUserId, reason, coordinationGroupId } = data;
  return runSerializable(async (tx) => {
    await tx.eventParticipant.deleteMany({ where: { eventId, userId } });
    if (coordinationGroupId) {
      await tx.groupMembers.deleteMany({
        where: { groupId: coordinationGroupId, memberId: userId },
      });
    }
    return tx.eventBan.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, bannedByUserId, reason },
      update: { bannedByUserId, reason, createdAt: new Date() },
    });
  });
};

export const deleteEventBan = async (eventId: string, userId: string) => {
  return prisma.eventBan.deleteMany({ where: { eventId, userId } });
};

interface FindEventBansInput {
  eventId: string;
  cursor?: string;
  limit: number;
}

export const findEventBansPage = async ({
  eventId,
  cursor,
  limit,
}: FindEventBansInput) => {
  const rows = await prisma.eventBan.findMany({
    where: { eventId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      user: { select: EVENT_CREATOR_SELECT },
      bannedBy: { select: EVENT_CREATOR_SELECT },
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

export const findOldestWaitlistedParticipant = async (eventId: string) => {
  return prisma.eventParticipant.findFirst({
    where: { eventId, status: "waitlisted" },
    orderBy: { createdAt: "asc" },
  });
};

interface FindEventParticipantsInput {
  eventId: string;
  status?: EventParticipantStatus;
  cursor?: string;
  limit: number;
  search?: string;
}

export const findEventParticipantsPage = async ({
  eventId,
  status,
  cursor,
  limit,
  search,
}: FindEventParticipantsInput) => {
  const rows = await prisma.eventParticipant.findMany({
    where: {
      eventId,
      ...(status ? { status } : {}),
      ...(search ? { user: userNameSearchClause(search) } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: { user: { select: EVENT_CREATOR_SELECT } },
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

export const findAllActiveParticipantUserIds = async (eventId: string) => {
  const rows = await prisma.eventParticipant.findMany({
    where: { eventId, status: { in: ["going", "interested", "waitlisted"] } },
    select: { userId: true },
  });
  return rows.map((row) => row.userId);
};
