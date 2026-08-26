import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    follow: { findMany: vi.fn() },
    like: { findMany: vi.fn() },
    comment: { findMany: vi.fn() },
    conversation: { findMany: vi.fn() },
    groupMembers: { findMany: vi.fn() },
  },
}));

import { prisma } from "../database/prisma.js";
import {
  getFollowConnectedUserIds,
  getShareRecipientGroups,
  getShareRecipients,
  getViewerRelevantUserIds,
} from "./relevance.repository.js";

const emptyRelevanceMocks = () => {
  vi.mocked(prisma.follow.findMany).mockResolvedValue([]);
  vi.mocked(prisma.like.findMany).mockResolvedValue([]);
  vi.mocked(prisma.comment.findMany).mockResolvedValue([]);
  vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);
};

describe("relevance.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getViewerRelevantUserIds", () => {
    it("unions every interaction source and dedupes overlapping ids", async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([{ followingId: "user-2" }] as never);
      vi.mocked(prisma.like.findMany)
        .mockResolvedValueOnce([{ userId: "user-2" }] as never) // liked my posts
        .mockResolvedValueOnce([{ post: { userId: "user-3" } }] as never); // my likes
      vi.mocked(prisma.comment.findMany)
        .mockResolvedValueOnce([{ userId: "user-4" }] as never)
        .mockResolvedValueOnce([{ post: { userId: "user-5" } }] as never);
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([
        { participantOneId: "viewer-1", participantTwoId: "user-6" },
      ] as never);

      const result = await getViewerRelevantUserIds("viewer-1");

      expect(result).toEqual(new Set(["user-2", "user-3", "user-4", "user-5", "user-6"]));
    });

    it("never includes the viewer themself, even if they'd otherwise match", async () => {
      emptyRelevanceMocks();
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([
        { participantOneId: "viewer-1", participantTwoId: "viewer-1" },
      ] as never);

      const result = await getViewerRelevantUserIds("viewer-1");
      expect(result.has("viewer-1")).toBe(false);
    });
  });

  describe("getFollowConnectedUserIds", () => {
    it("resolves the other side regardless of follow direction", async () => {
      vi.mocked(prisma.follow.findMany).mockResolvedValue([
        { followerId: "viewer-1", followingId: "user-2" },
        { followerId: "user-3", followingId: "viewer-1" },
      ] as never);

      const result = await getFollowConnectedUserIds("viewer-1");

      expect(result).toEqual(new Set(["user-2", "user-3"]));
    });
  });

  describe("getShareRecipients", () => {
    const user = (id: string) => ({ id, firstName: id, lastName: null, name: null, profilePicture: null });

    it("keeps the most recent interaction when the same person appears via multiple signals", async () => {
      vi.mocked(prisma.groupMembers.findMany).mockResolvedValue([]);
      vi.mocked(prisma.follow.findMany).mockResolvedValue([
        {
          followerId: "viewer-1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          following: user("user-2"),
          follower: user("viewer-1"),
        },
      ] as never);
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([
        {
          participantOneId: "viewer-1",
          updatedAt: new Date("2026-03-01T00:00:00.000Z"),
          participantOne: user("viewer-1"),
          participantTwo: user("user-2"),
        },
      ] as never);

      const result = await getShareRecipients("viewer-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: "user-2", lastInteractionAt: new Date("2026-03-01T00:00:00.000Z") });
    });

    it("sorts recipients by most recent interaction first", async () => {
      vi.mocked(prisma.groupMembers.findMany).mockResolvedValue([]);
      vi.mocked(prisma.follow.findMany).mockResolvedValue([
        {
          followerId: "viewer-1",
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          following: user("older"),
          follower: user("viewer-1"),
        },
        {
          followerId: "viewer-1",
          createdAt: new Date("2026-06-01T00:00:00.000Z"),
          following: user("newer"),
          follower: user("viewer-1"),
        },
      ] as never);
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

      const result = await getShareRecipients("viewer-1");

      expect(result.map((r) => r.id)).toEqual(["newer", "older"]);
    });

    it("skips the co-member query entirely when the viewer belongs to no groups", async () => {
      vi.mocked(prisma.groupMembers.findMany).mockResolvedValue([]);
      vi.mocked(prisma.follow.findMany).mockResolvedValue([]);
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

      await getShareRecipients("viewer-1");

      // Only the membership lookup ran; the second (co-member) call never fired.
      expect(prisma.groupMembers.findMany).toHaveBeenCalledTimes(1);
    });

    it("excludes the viewer even if they'd otherwise appear as their own recipient", async () => {
      vi.mocked(prisma.groupMembers.findMany).mockResolvedValue([]);
      vi.mocked(prisma.follow.findMany).mockResolvedValue([
        {
          followerId: "user-2",
          createdAt: new Date(),
          following: user("viewer-1"),
          follower: user("user-2"),
        },
      ] as never);
      vi.mocked(prisma.conversation.findMany).mockResolvedValue([]);

      const result = await getShareRecipients("viewer-1");

      expect(result.map((r) => r.id)).toEqual(["user-2"]);
    });
  });

  describe("getShareRecipientGroups", () => {
    it("maps and sorts groups by most recently active first", async () => {
      vi.mocked(prisma.groupMembers.findMany).mockResolvedValue([
        {
          group: {
            id: "g1",
            name: "Older",
            coverImageUrl: null,
            visibility: "public",
            updatedAt: new Date("2026-01-01T00:00:00.000Z"),
          },
        },
        {
          group: {
            id: "g2",
            name: "Newer",
            coverImageUrl: null,
            visibility: "public",
            updatedAt: new Date("2026-06-01T00:00:00.000Z"),
          },
        },
      ] as never);

      const result = await getShareRecipientGroups("viewer-1");

      expect(result.map((g) => g.id)).toEqual(["g2", "g1"]);
    });
  });
});
