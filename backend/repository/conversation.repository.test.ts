import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    conversation: { findFirst: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from "../database/prisma.js";
import { encodeCursor } from "../lib/keysetCursor.js";
import {
  createConversation,
  findConversationById,
  findConversationByParticipants,
  findConversationsPage,
  markConversationRead,
  setConversationClearedAndHiddenAt,
  setConversationHiddenAt,
} from "./conversation.repository.js";

describe("conversation.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("findConversationByParticipants matches either participant order", async () => {
    await findConversationByParticipants("user-a", "user-b");
    expect(prisma.conversation.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { participantOneId: "user-a", participantTwoId: "user-b" },
          { participantOneId: "user-b", participantTwoId: "user-a" },
        ],
      },
    });
  });

  it("createConversation stores participants in a stable sorted order regardless of call order", async () => {
    await createConversation({ authUserId: "user-b", otherUserId: "user-a" });
    expect(prisma.conversation.create).toHaveBeenCalledWith({
      data: { participantOneId: "user-a", participantTwoId: "user-b" },
    });
  });

  describe("findConversationById", () => {
    it("returns null for a missing conversation", async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
      expect(await findConversationById("convo-1")).toBeNull();
    });

    it("collapses participantOne/participantTwo into a participants array", async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        id: "convo-1",
        participantOne: { id: "user-a" },
        participantTwo: { id: "user-b" },
      } as never);

      const result = await findConversationById("convo-1");

      expect(result?.participants).toEqual([{ id: "user-a" }, { id: "user-b" }]);
    });
  });

  describe("markConversationRead", () => {
    it("returns null for a missing conversation", async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue(null);
      expect(await markConversationRead("convo-1", "user-a")).toBeNull();
      expect(prisma.conversation.update).not.toHaveBeenCalled();
    });

    it("stamps participantOne's read field when the reader is participant one", async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        participantOneId: "user-a",
        participantTwoId: "user-b",
      } as never);

      await markConversationRead("convo-1", "user-a");

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "convo-1" },
        data: { lastReadAtParticipantOne: expect.any(Date) },
      });
    });

    it("stamps participantTwo's read field when the reader is participant two", async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        participantOneId: "user-a",
        participantTwoId: "user-b",
      } as never);

      await markConversationRead("convo-1", "user-b");

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "convo-1" },
        data: { lastReadAtParticipantTwo: expect.any(Date) },
      });
    });
  });

  describe("setConversationHiddenAt / setConversationClearedAndHiddenAt", () => {
    it("targets the calling participant's own hidden field", async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        participantOneId: "user-a",
        participantTwoId: "user-b",
      } as never);

      await setConversationHiddenAt("convo-1", "user-b", null);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "convo-1" },
        data: { hiddenAtParticipantTwo: null },
      });
    });

    it("stamps both cleared and hidden fields together for the calling participant", async () => {
      vi.mocked(prisma.conversation.findUnique).mockResolvedValue({
        participantOneId: "user-a",
        participantTwoId: "user-b",
      } as never);
      const at = new Date("2026-01-01T00:00:00.000Z");

      await setConversationClearedAndHiddenAt("convo-1", "user-a", at);

      expect(prisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "convo-1" },
        data: { clearedAtParticipantOne: at, hiddenAtParticipantOne: at },
      });
    });
  });

  describe("findConversationsPage", () => {
    const row = (overrides = {}) => ({
      id: "convo-1",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      myClearedAt: null,
      otherUserId: "user-b",
      otherUsername: "jane",
      otherFirstName: "Jane",
      otherLastName: "Doe",
      otherName: null,
      otherProfilePicture: null,
      otherUniversity: null,
      otherAccountType: "normal",
      lastMessageId: "message-1",
      lastMessageContent: "hi",
      lastMessageImageUrls: null,
      lastMessageAudioUrl: null,
      lastMessageSharedPostId: null,
      lastMessageSenderId: "user-b",
      lastMessageCreatedAt: new Date("2026-01-01T00:00:00.000Z"),
      unreadCount: 2,
      ...overrides,
    });

    it("maps a row into the conversation-list shape, including unread count", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([row()]);

      const page = await findConversationsPage({ userId: "user-a", scope: "active", limit: 10 });

      expect(page.conversations[0]).toEqual({
        id: "convo-1",
        updatedAt: row().updatedAt,
        unreadCount: 2,
        user: {
          id: "user-b",
          username: "jane",
          firstName: "Jane",
          lastName: "Doe",
          name: null,
          profilePicture: null,
          university: null,
          accountType: "normal",
        },
        lastMessage: {
          content: "hi",
          imageUrls: [],
          audioUrl: null,
          sharedPostId: null,
          senderId: "user-b",
        },
      });
    });

    it("hides the last-message preview once it predates the user clearing the conversation", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([
        row({ myClearedAt: new Date("2026-02-01T00:00:00.000Z") }),
      ]);

      const page = await findConversationsPage({ userId: "user-a", scope: "active", limit: 10 });

      expect(page.conversations[0]?.lastMessage).toBeNull();
    });

    it("reports hasMore and a valid cursor once the lookahead row is trimmed", async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([row({ id: "c1" }), row({ id: "c2" })]);

      const page = await findConversationsPage({ userId: "user-a", scope: "active", limit: 1 });

      expect(page.conversations).toHaveLength(1);
      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBe(encodeCursor(row().updatedAt, "c1"));
    });
  });
});
