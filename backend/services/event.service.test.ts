import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repository/event.repository.js", async () => {
  const actual = await vi.importActual<typeof import("../repository/event.repository.js")>(
    "../repository/event.repository.js",
  );
  return {
    EventBannedError: actual.EventBannedError,
    createEvent: vi.fn(),
    findEventById: vi.fn(),
    updateEvent: vi.fn(),
    cancelEvent: vi.fn(),
    setEventCoverImage: vi.fn(),
    setEventCoordinationGroupId: vi.fn(),
    createEventAnnouncementPost: vi.fn(),
    findDiscoverableEvents: vi.fn(),
    findMyEvents: vi.fn(),
    findEventParticipant: vi.fn(),
    countGoingParticipants: vi.fn(),
    countParticipantsByStatus: vi.fn(),
    deleteEventParticipant: vi.fn(),
    acquireEventParticipant: vi.fn(),
    findOldestWaitlistedParticipant: vi.fn(),
    findEventParticipantsPage: vi.fn(),
    findAllActiveParticipantUserIds: vi.fn(),
    banEventParticipant: vi.fn(),
    deleteEventBan: vi.fn(),
    findEventBansPage: vi.fn(),
  };
});
vi.mock("../repository/group-members.repository.js", async () => {
  const actual = await vi.importActual<typeof import("../repository/group-members.repository.js")>(
    "../repository/group-members.repository.js",
  );
  return {
    GroupBannedError: actual.GroupBannedError,
    findGroupMember: vi.fn(),
    createGroupMember: vi.fn(),
    acquireGroupMember: vi.fn(),
  };
});
vi.mock("../repository/group.repository.js", () => ({
  createGroup: vi.fn(),
}));
vi.mock("../repository/relevance.repository.js", () => ({
  getFollowConnectedUserIds: vi.fn(),
}));
vi.mock("../repository/notification.repository.js", () => ({
  createNotification: vi.fn(),
  emitNewNotification: vi.fn(),
}));
vi.mock("../lib/storage.js", () => ({
  uploadImage: vi.fn(),
  deleteImages: vi.fn(),
}));
vi.mock("../lib/ics.js", () => ({
  buildIcsCalendar: vi.fn(),
}));

import {
  acquireEventParticipant,
  banEventParticipant,
  cancelEvent,
  countGoingParticipants,
  createEvent,
  createEventAnnouncementPost,
  deleteEventParticipant,
  EventBannedError,
  findAllActiveParticipantUserIds,
  findEventById,
  findEventParticipant,
  findOldestWaitlistedParticipant,
  updateEvent,
} from "../repository/event.repository.js";
import {
  acquireGroupMember,
  createGroupMember,
  findGroupMember,
  GroupBannedError,
} from "../repository/group-members.repository.js";
import { createGroup } from "../repository/group.repository.js";
import { createNotification, emitNewNotification } from "../repository/notification.repository.js";
import { buildIcsCalendar } from "../lib/ics.js";
import {
  banEventParticipantService,
  cancelEventService,
  cancelRsvpService,
  createEventService,
  deriveEventStatus,
  deriveEventType,
  getEventService,
  joinEventChatService,
  rsvpEventService,
  updateEventService,
} from "./event.service.js";

const creator = (overrides = {}) => ({
  accountType: "normal",
  identityVerified: "false",
  ...overrides,
});

describe("deriveEventStatus", () => {
  it("is cancelled when cancelledAt is set, regardless of dates", () => {
    expect(
      deriveEventStatus({ cancelledAt: new Date(), startAt: new Date(Date.now() + 100_000), endAt: null }),
    ).toBe("cancelled");
  });

  it("is upcoming before startAt", () => {
    expect(
      deriveEventStatus({ cancelledAt: null, startAt: new Date(Date.now() + 100_000), endAt: null }),
    ).toBe("upcoming");
  });

  it("is ongoing between startAt and endAt", () => {
    expect(
      deriveEventStatus({
        cancelledAt: null,
        startAt: new Date(Date.now() - 100_000),
        endAt: new Date(Date.now() + 100_000),
      }),
    ).toBe("ongoing");
  });

  it("is completed after the effective end (startAt when there's no endAt)", () => {
    expect(
      deriveEventStatus({ cancelledAt: null, startAt: new Date(Date.now() - 100_000), endAt: null }),
    ).toBe("completed");
  });
});

describe("deriveEventType", () => {
  it("is official for an identity-verified business account", () => {
    expect(deriveEventType(creator({ accountType: "business", identityVerified: "true" }))).toBe(
      "official",
    );
  });

  it("is community for a normal account or an unverified business", () => {
    expect(deriveEventType(creator())).toBe("community");
    expect(deriveEventType(creator({ accountType: "business", identityVerified: "false" }))).toBe(
      "community",
    );
  });
});

describe("event.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEventService", () => {
    it("rejects hosting under a group the creator isn't an admin of", async () => {
      vi.mocked(findGroupMember).mockResolvedValue({ role: "member" } as never);

      await expect(
        createEventService({ creatorId: "user-1", hostGroupId: "group-1", title: "T", startAt: new Date() }),
      ).rejects.toThrow("Only group admins can host an event as this group");
      expect(createEvent).not.toHaveBeenCalled();
    });

    it("creates an announcement post for a public event but not a private one", async () => {
      vi.mocked(createEvent).mockResolvedValue({ id: "event-1", visibility: "public" } as never);
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        visibility: "public",
        startAt: new Date(),
        endAt: null,
        cancelledAt: null,
        creator: creator(),
      } as never);

      await createEventService({ creatorId: "user-1", title: "T", startAt: new Date() });
      expect(createEventAnnouncementPost).toHaveBeenCalled();

      vi.mocked(createEvent).mockResolvedValue({ id: "event-2", visibility: "private" } as never);
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-2",
        visibility: "private",
        startAt: new Date(),
        endAt: null,
        cancelledAt: null,
        creator: creator(),
      } as never);
      vi.mocked(createEventAnnouncementPost).mockClear();

      await createEventService({ creatorId: "user-1", title: "T", startAt: new Date() });
      expect(createEventAnnouncementPost).not.toHaveBeenCalled();
    });
  });

  describe("getEventService (private-event visibility gate)", () => {
    const privateEvent = {
      id: "event-1",
      visibility: "private",
      creatorId: "host-1",
      hostGroupId: null,
      startAt: new Date(),
      endAt: null,
      cancelledAt: null,
      creator: creator(),
    };

    it("rejects a non-participant viewer", async () => {
      vi.mocked(findEventById).mockResolvedValue(privateEvent as never);
      vi.mocked(findEventParticipant).mockResolvedValue(null);

      await expect(getEventService("event-1", "stranger")).rejects.toThrow(
        "This event is private",
      );
    });

    it("allows the host", async () => {
      vi.mocked(findEventById).mockResolvedValue(privateEvent as never);
      vi.mocked(findEventParticipant).mockResolvedValue(null);

      await expect(getEventService("event-1", "host-1")).resolves.toBeDefined();
    });

    it("allows an existing participant", async () => {
      vi.mocked(findEventById).mockResolvedValue(privateEvent as never);
      vi.mocked(findEventParticipant).mockResolvedValue({ status: "going" } as never);

      await expect(getEventService("event-1", "participant-1")).resolves.toBeDefined();
    });
  });

  describe("updateEventService", () => {
    const before = {
      id: "event-1",
      startAt: new Date("2026-01-01T10:00:00Z"),
      endAt: new Date("2026-01-01T12:00:00Z"),
      location: "Room A",
      virtualUrl: null,
      creator: creator(),
    };

    beforeEach(() => {
      vi.mocked(findEventById).mockResolvedValue(before as never);
      vi.mocked(updateEvent).mockResolvedValue({ ...before, title: "T", creatorId: "host-1" } as never);
      vi.mocked(findAllActiveParticipantUserIds).mockResolvedValue(["p1"]);
      vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);
    });

    it("notifies participants when the location changes", async () => {
      await updateEventService("event-1", { location: "Room B" });
      expect(createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: "p1", type: "event-update" }),
      );
    });

    it("does not notify participants for an unrelated field change", async () => {
      await updateEventService("event-1", { description: "New description" });
      expect(createNotification).not.toHaveBeenCalled();
    });
  });

  it("cancelEventService always notifies active participants", async () => {
    vi.mocked(cancelEvent).mockResolvedValue({
      id: "event-1",
      title: "Party",
      creatorId: "host-1",
      startAt: new Date(),
      endAt: null,
      cancelledAt: new Date(),
      creator: creator(),
    } as never);
    vi.mocked(findAllActiveParticipantUserIds).mockResolvedValue(["p1", "p2"]);
    vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);

    await cancelEventService("event-1");

    expect(createNotification).toHaveBeenCalledTimes(2);
  });

  describe("rsvpEventService", () => {
    it("rejects RSVPing to a cancelled event", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        cancelledAt: new Date(),
        startAt: new Date(),
        endAt: null,
      } as never);

      await expect(rsvpEventService("event-1", "user-1", "going")).rejects.toThrow(
        "This event has been cancelled",
      );
    });

    it("waitlists a new 'going' RSVP once capacity is full", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        cancelledAt: null,
        startAt: new Date(),
        endAt: null,
        capacity: 2,
      } as never);
      vi.mocked(findEventParticipant).mockResolvedValue(null);
      vi.mocked(countGoingParticipants).mockResolvedValue(2);

      await rsvpEventService("event-1", "user-1", "going");

      expect(acquireEventParticipant).toHaveBeenCalledWith("event-1", "user-1", "waitlisted");
    });

    it("lets an already-going participant re-RSVP as going even at capacity", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        cancelledAt: null,
        startAt: new Date(),
        endAt: null,
        capacity: 2,
      } as never);
      vi.mocked(findEventParticipant).mockResolvedValue({ status: "going" } as never);
      vi.mocked(countGoingParticipants).mockResolvedValue(2);

      await rsvpEventService("event-1", "user-1", "going");

      expect(acquireEventParticipant).toHaveBeenCalledWith("event-1", "user-1", "going");
    });

    it("does not apply capacity limits to 'interested' RSVPs", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        cancelledAt: null,
        startAt: new Date(),
        endAt: null,
        capacity: 1,
      } as never);

      await rsvpEventService("event-1", "user-1", "interested");

      expect(acquireEventParticipant).toHaveBeenCalledWith("event-1", "user-1", "interested");
      expect(countGoingParticipants).not.toHaveBeenCalled();
    });
  });

  describe("cancelRsvpService", () => {
    it("does nothing when there was no RSVP", async () => {
      vi.mocked(findEventParticipant).mockResolvedValue(null);
      await cancelRsvpService("event-1", "user-1");
      expect(deleteEventParticipant).not.toHaveBeenCalled();
    });

    it("does not promote anyone if the cancelled RSVP wasn't 'going'", async () => {
      vi.mocked(findEventParticipant).mockResolvedValue({ status: "interested" } as never);
      await cancelRsvpService("event-1", "user-1");
      expect(findOldestWaitlistedParticipant).not.toHaveBeenCalled();
    });

    it("promotes the oldest waitlisted participant and notifies them", async () => {
      vi.mocked(findEventParticipant).mockResolvedValue({ status: "going" } as never);
      vi.mocked(findOldestWaitlistedParticipant).mockResolvedValue({ userId: "waiting-1" } as never);
      vi.mocked(findEventById).mockResolvedValue({ id: "event-1", title: "Party" } as never);
      vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);

      await cancelRsvpService("event-1", "user-1");

      expect(acquireEventParticipant).toHaveBeenCalledWith("event-1", "waiting-1", "going");
      expect(emitNewNotification).toHaveBeenCalledWith("waiting-1", { id: "notif-1" });
    });

    it("leaves the spot open (no throw) if the promoted user was banned in the meantime", async () => {
      vi.mocked(findEventParticipant).mockResolvedValue({ status: "going" } as never);
      vi.mocked(findOldestWaitlistedParticipant).mockResolvedValue({ userId: "waiting-1" } as never);
      vi.mocked(acquireEventParticipant).mockRejectedValue(new EventBannedError("banned"));

      await expect(cancelRsvpService("event-1", "user-1")).resolves.toBeUndefined();
      expect(createNotification).not.toHaveBeenCalled();
    });
  });

  describe("joinEventChatService", () => {
    it("rejects a non-host, non-participant", async () => {
      vi.mocked(findEventById).mockResolvedValue({ id: "event-1", creatorId: "host-1" } as never);
      vi.mocked(findEventParticipant).mockResolvedValue(null);

      await expect(joinEventChatService("event-1", "stranger")).rejects.toThrow(
        "You must RSVP to the event before joining its chat",
      );
    });

    it("creates a coordination group the first time and makes the caller its admin", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        creatorId: "host-1",
        title: "Party",
        coordinationGroup: null,
      } as never);
      vi.mocked(createGroup).mockResolvedValue({ id: "group-1" } as never);

      const result = await joinEventChatService("event-1", "host-1");

      expect(createGroupMember).toHaveBeenCalledWith({ groupId: "group-1", userId: "host-1", role: "admin" });
      expect(result).toEqual({ id: "group-1" });
    });

    it("reuses an existing coordination group for a member who already joined", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        creatorId: "host-1",
        coordinationGroup: { id: "group-1" },
      } as never);
      vi.mocked(findEventParticipant).mockResolvedValue({ status: "going" } as never);
      vi.mocked(findGroupMember).mockResolvedValue({ role: "member" } as never);

      const result = await joinEventChatService("event-1", "participant-1");

      expect(acquireGroupMember).not.toHaveBeenCalled();
      expect(result).toEqual({ id: "group-1" });
    });

    it("surfaces a friendly error if the user was banned from the event's chat", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        creatorId: "host-1",
        coordinationGroup: { id: "group-1" },
      } as never);
      vi.mocked(findEventParticipant).mockResolvedValue({ status: "going" } as never);
      vi.mocked(findGroupMember).mockResolvedValue(null);
      vi.mocked(acquireGroupMember).mockRejectedValue(new GroupBannedError("banned"));

      await expect(joinEventChatService("event-1", "participant-1")).rejects.toThrow(
        "You've been removed from this event's chat and can't rejoin",
      );
    });
  });

  it("buildEventIcsService respects the private-event visibility gate before building the calendar", async () => {
    vi.mocked(findEventById).mockResolvedValue({
      id: "event-1",
      visibility: "private",
      creatorId: "host-1",
      hostGroupId: null,
    } as never);
    vi.mocked(findEventParticipant).mockResolvedValue(null);

    const { buildEventIcsService } = await import("./event.service.js");
    await expect(buildEventIcsService("event-1", "stranger")).rejects.toThrow(
      "This event is private",
    );
    expect(buildIcsCalendar).not.toHaveBeenCalled();
  });

  describe("banEventParticipantService", () => {
    it("refuses to ban the event's host", async () => {
      vi.mocked(findEventById).mockResolvedValue({ id: "event-1", creatorId: "host-1", hostGroupId: null } as never);

      await expect(
        banEventParticipantService("event-1", "host-1", "admin-1", "spam"),
      ).rejects.toThrow("Event hosts can't be banned - remove their host access first");
      expect(banEventParticipant).not.toHaveBeenCalled();
    });

    it("bans a non-host and notifies them", async () => {
      vi.mocked(findEventById).mockResolvedValue({
        id: "event-1",
        creatorId: "host-1",
        hostGroupId: null,
        title: "Party",
      } as never);
      vi.mocked(banEventParticipant).mockResolvedValue({ id: "ban-1" } as never);
      vi.mocked(createNotification).mockResolvedValue({ id: "notif-1" } as never);

      const result = await banEventParticipantService("event-1", "target-1", "admin-1", "spam");

      expect(result).toEqual({ id: "ban-1" });
      expect(emitNewNotification).toHaveBeenCalledWith("target-1", { id: "notif-1" });
    });
  });
});
