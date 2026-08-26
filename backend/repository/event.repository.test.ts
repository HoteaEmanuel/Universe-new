import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  eventBan: { findUnique: vi.fn(), upsert: vi.fn() },
  eventParticipant: { upsert: vi.fn(), deleteMany: vi.fn() },
  groupMembers: { deleteMany: vi.fn() },
};

vi.mock("../database/prisma.js", () => ({
  prisma: {
    event: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    post: { create: vi.fn() },
    eventParticipant: {
      findUnique: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    eventBan: { findUnique: vi.fn(), deleteMany: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("../lib/relevantFirstPage.js", () => ({
  getRelevantFirstPage: vi.fn(),
}));
vi.mock("../lib/serializableTransaction.js", () => ({
  runSerializable: vi.fn((callback: (tx: unknown) => unknown) => callback(tx)),
}));

import { prisma } from "../database/prisma.js";
import { getRelevantFirstPage } from "../lib/relevantFirstPage.js";
import {
  acquireEventParticipant,
  banEventParticipant,
  countParticipantsByStatus,
  createEvent,
  EventBannedError,
  findAllActiveParticipantUserIds,
  findDiscoverableEvents,
  findEventById,
  findEventParticipantsPage,
  findMyEvents,
} from "./event.repository.js";

describe("event.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createEvent includes the standard event relations", async () => {
    await createEvent({ creatorId: "user-1", title: "T", startAt: new Date() });
    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({ include: expect.objectContaining({ creator: expect.anything() }) }),
    );
  });

  it("findEventById looks up by id with relations included", async () => {
    await findEventById("event-1");
    expect(prisma.event.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "event-1" } }),
    );
  });

  describe("countParticipantsByStatus", () => {
    it("fills in zero counts for statuses with no rows", async () => {
      vi.mocked(prisma.eventParticipant.groupBy).mockResolvedValue([
        { status: "going", _count: 3 },
      ] as never);

      const result = await countParticipantsByStatus("event-1");

      expect(result).toEqual({ going: 3, interested: 0, waitlisted: 0 });
    });
  });

  describe("findMyEvents", () => {
    it("filters by creatorId for the 'hosting' scope", async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([]);
      await findMyEvents({ userId: "user-1", scope: "hosting", limit: 10 });
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { creatorId: "user-1" } }),
      );
    });

    it("filters by participant status for other scopes", async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([]);
      await findMyEvents({ userId: "user-1", scope: "going", limit: 10 });
      expect(prisma.event.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { participants: { some: { userId: "user-1", status: "going" } } },
        }),
      );
    });

    it("paginates with a lookahead row", async () => {
      vi.mocked(prisma.event.findMany).mockResolvedValue([{ id: "1" }, { id: "2" }] as never);
      const page = await findMyEvents({ userId: "user-1", scope: "hosting", limit: 1 });
      expect(page).toEqual({ items: [{ id: "1" }], nextCursor: "1", hasMore: true });
    });
  });

  describe("findDiscoverableEvents", () => {
    it("skips the relevant-fetch entirely with no connected users", async () => {
      vi.mocked(getRelevantFirstPage).mockImplementation(async (opts: never) =>
        (opts as { fetchRelevant: () => Promise<unknown> }).fetchRelevant() as never,
      );

      const result = await findDiscoverableEvents({ connectedUserIds: [], cursor: undefined, limit: 10 });

      expect(result).toEqual([]);
      expect(prisma.event.findMany).not.toHaveBeenCalled();
    });

    it("delegates paging to getRelevantFirstPage with relevant/non-relevant fetchers", async () => {
      vi.mocked(getRelevantFirstPage).mockResolvedValue({ items: [], nextCursor: null, hasMore: false });

      await findDiscoverableEvents({ connectedUserIds: ["user-2"], cursor: "c1", limit: 10 });

      expect(getRelevantFirstPage).toHaveBeenCalledWith(
        expect.objectContaining({ cursor: "c1", limit: 10 }),
      );
    });
  });

  describe("acquireEventParticipant (runs inside runSerializable)", () => {
    it("throws EventBannedError instead of writing a participant row when banned", async () => {
      tx.eventBan.findUnique.mockResolvedValue({ id: "ban-1" });

      await expect(acquireEventParticipant("event-1", "user-1", "going")).rejects.toBeInstanceOf(
        EventBannedError,
      );
      expect(tx.eventParticipant.upsert).not.toHaveBeenCalled();
    });

    it("upserts the participant row when there's no ban", async () => {
      tx.eventBan.findUnique.mockResolvedValue(null);
      tx.eventParticipant.upsert.mockResolvedValue({ id: "participant-1" });

      const result = await acquireEventParticipant("event-1", "user-1", "going");

      expect(result).toEqual({ id: "participant-1" });
    });
  });

  describe("banEventParticipant (runs inside runSerializable)", () => {
    it("removes the participant row and coordination-group membership, then upserts the ban", async () => {
      tx.eventBan.upsert.mockResolvedValue({ id: "ban-1" });

      const result = await banEventParticipant({
        eventId: "event-1",
        userId: "user-1",
        bannedByUserId: "admin-1",
        coordinationGroupId: "group-1",
      });

      expect(tx.eventParticipant.deleteMany).toHaveBeenCalledWith({
        where: { eventId: "event-1", userId: "user-1" },
      });
      expect(tx.groupMembers.deleteMany).toHaveBeenCalledWith({
        where: { groupId: "group-1", memberId: "user-1" },
      });
      expect(result).toEqual({ id: "ban-1" });
    });

    it("skips the group-membership cleanup when there's no coordination group", async () => {
      await banEventParticipant({ eventId: "event-1", userId: "user-1", bannedByUserId: "admin-1" });
      expect(tx.groupMembers.deleteMany).not.toHaveBeenCalled();
    });
  });

  it("findEventParticipantsPage filters by status only when provided", async () => {
    vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([]);
    await findEventParticipantsPage({ eventId: "event-1", status: undefined, limit: 10 });
    expect(prisma.eventParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: "event-1" } }),
    );
  });

  it("findAllActiveParticipantUserIds only counts going/interested/waitlisted", async () => {
    vi.mocked(prisma.eventParticipant.findMany).mockResolvedValue([{ userId: "u1" }] as never);
    const ids = await findAllActiveParticipantUserIds("event-1");
    expect(ids).toEqual(["u1"]);
    expect(prisma.eventParticipant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { eventId: "event-1", status: { in: ["going", "interested", "waitlisted"] } },
      }),
    );
  });
});
