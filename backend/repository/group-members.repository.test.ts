import { beforeEach, describe, expect, it, vi } from "vitest";

const tx = {
  groupBan: { findUnique: vi.fn(), upsert: vi.fn() },
  groupMembers: { create: vi.fn(), deleteMany: vi.fn() },
};

vi.mock("../database/prisma.js", () => ({
  prisma: {
    groupMembers: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    groupBan: { findUnique: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));
vi.mock("../lib/serializableTransaction.js", () => ({
  runSerializable: vi.fn((callback: (tx: unknown) => unknown) => callback(tx)),
}));

import { prisma } from "../database/prisma.js";
import { encodeCursor } from "../lib/keysetCursor.js";
import {
  acquireGroupMember,
  banGroupMember,
  findGroupMembersByUsernames,
  findUserGroupsPage,
  GroupBannedError,
  searchGroupMembersByUsername,
} from "./group-members.repository.js";

describe("group-members.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("acquireGroupMember (runs inside runSerializable)", () => {
    it("throws GroupBannedError instead of inserting a membership row when banned", async () => {
      tx.groupBan.findUnique.mockResolvedValue({ id: "ban-1" });
      await expect(acquireGroupMember({ groupId: "g1", userId: "u1" })).rejects.toBeInstanceOf(
        GroupBannedError,
      );
      expect(tx.groupMembers.create).not.toHaveBeenCalled();
    });

    it("creates the membership when there's no ban", async () => {
      tx.groupBan.findUnique.mockResolvedValue(null);
      tx.groupMembers.create.mockResolvedValue({ id: "member-1" });
      const result = await acquireGroupMember({ groupId: "g1", userId: "u1", role: "member" });
      expect(result).toEqual({ id: "member-1" });
    });
  });

  it("banGroupMember removes the membership and upserts the ban", async () => {
    tx.groupBan.upsert.mockResolvedValue({ id: "ban-1" });
    const result = await banGroupMember({ groupId: "g1", userId: "u1", bannedByUserId: "admin-1" });
    expect(tx.groupMembers.deleteMany).toHaveBeenCalledWith({ where: { groupId: "g1", memberId: "u1" } });
    expect(result).toEqual({ id: "ban-1" });
  });

  describe("findGroupMembersByUsernames", () => {
    it("short-circuits to an empty array with no usernames", async () => {
      expect(await findGroupMembersByUsernames("g1", [])).toEqual([]);
      expect(prisma.groupMembers.findMany).not.toHaveBeenCalled();
    });

    it("unwraps membership rows to their member users", async () => {
      vi.mocked(prisma.groupMembers.findMany).mockResolvedValue([
        { member: { id: "u1", username: "jane" } },
      ] as never);
      const result = await findGroupMembersByUsernames("g1", ["jane"]);
      expect(result).toEqual([{ id: "u1", username: "jane" }]);
    });
  });

  it("searchGroupMembersByUsername sorts matches alphabetically by username", async () => {
    vi.mocked(prisma.groupMembers.findMany).mockResolvedValue([
      { member: { id: "u1", username: "zed" } },
      { member: { id: "u2", username: "amy" } },
    ] as never);

    const result = await searchGroupMembersByUsername("g1", "a");

    expect(result.map((u) => u.username)).toEqual(["amy", "zed"]);
  });

  describe("findUserGroupsPage", () => {
    const row = (overrides = {}) => ({
      id: "g1",
      name: "Study Group",
      description: null,
      coverImageUrl: null,
      visibility: "public",
      university: null,
      courseTag: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      lastMessageId: null,
      lastMessageContent: null,
      lastMessageImageUrls: null,
      lastMessageAudioUrl: null,
      lastMessageSharedPostId: null,
      lastMessageSenderId: null,
      senderUsername: null,
      senderFirstName: null,
      senderLastName: null,
      senderName: null,
      senderProfilePicture: null,
      ...overrides,
    });

    it("leaves lastMessage undefined when the group has no messages yet", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([row()]);
      const page = await findUserGroupsPage({ userId: "user-1", limit: 10 });
      expect(page.groups[0]?.lastMessage).toBeUndefined();
    });

    it("nests the sender only when the last message has one", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        row({
          lastMessageId: "gm-1",
          lastMessageContent: "hi",
          lastMessageSenderId: "sender-1",
          senderUsername: "jane",
        }),
      ]);

      const page = await findUserGroupsPage({ userId: "user-1", limit: 10 });

      expect(page.groups[0]?.lastMessage).toMatchObject({
        content: "hi",
        sender: expect.objectContaining({ id: "sender-1", username: "jane" }),
      });
    });

    it("reports hasMore and a valid cursor once the lookahead row is trimmed", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([row({ id: "g1" }), row({ id: "g2" })]);
      const page = await findUserGroupsPage({ userId: "user-1", limit: 1 });
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBe(encodeCursor(row().updatedAt, "g1"));
    });
  });
});
