import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../database/prisma.js", () => ({
  prisma: {
    message: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    groupMessage: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    attachment: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  },
}));

import { prisma } from "../database/prisma.js";
import {
  countUnreadMessages,
  createGroupMessage,
  createMessage,
  getConversationFilesPage,
  getConversationMediaPage,
  getConversationMessagesPage,
} from "./message.repository.js";

describe("message.repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createMessage", () => {
    it("defaults optional fields and omits attachments when none are provided", async () => {
      await createMessage({ conversationId: "c1", senderId: "s1", receiverId: "r1", content: "hi" });

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            imageUrls: [],
            imagePublicIds: [],
            audioUrl: null,
            attachments: undefined,
          }),
        }),
      );
    });

    it("wraps attachments in a nested create when provided", async () => {
      const attachments = [
        { fileUrl: "url", fileKey: "key", fileName: "a.pdf", fileSize: 1, mimeType: "application/pdf" },
      ];
      await createMessage({ conversationId: "c1", senderId: "s1", receiverId: "r1", attachments });

      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ attachments: { create: attachments } }) }),
      );
    });
  });

  describe("createGroupMessage", () => {
    it("nests a poll create with positioned options when a poll is provided", async () => {
      await createGroupMessage({
        senderId: "s1",
        groupId: "g1",
        poll: { authorId: "s1", question: "Q?", options: ["A", "B"] },
      });

      const call = vi.mocked(prisma.groupMessage.create).mock.calls[0]![0] as never as {
        data: { poll: { create: { question: string; options: { create: { text: string; position: number }[] } } } };
      };
      expect(call.data.poll.create.question).toBe("Q?");
      expect(call.data.poll.create.options.create).toEqual([
        { text: "A", position: 0 },
        { text: "B", position: 1 },
      ]);
    });

    it("connects mentioned users only when ids are provided", async () => {
      await createGroupMessage({ senderId: "s1", groupId: "g1", mentionedUserIds: ["u1", "u2"] });
      expect(prisma.groupMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mentionedUsers: { connect: [{ id: "u1" }, { id: "u2" }] } }),
        }),
      );

      vi.mocked(prisma.groupMessage.create).mockClear();
      await createGroupMessage({ senderId: "s1", groupId: "g1" });
      expect(prisma.groupMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ mentionedUsers: undefined }) }),
      );
    });
  });

  describe("getConversationMessagesPage", () => {
    it("reverses the fetched (newest-first) page back into chronological order for display", async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([
        { id: "newest" },
        { id: "middle" },
        { id: "oldest" },
      ] as never);

      const page = await getConversationMessagesPage("c1", undefined, 30);

      expect(page.messages.map((m) => m.id)).toEqual(["oldest", "middle", "newest"]);
    });

    it("trims the lookahead row before reversing and reports hasMore", async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([
        { id: "3" },
        { id: "2" },
        { id: "1" },
      ] as never);

      const page = await getConversationMessagesPage("c1", undefined, 2);

      expect(page.messages.map((m) => m.id)).toEqual(["2", "3"]);
      expect(page.hasMore).toBe(true);
      // The cursor is the oldest row *of this page* (before the display
      // reverse) - "1" was only ever a lookahead row and was trimmed off.
      expect(page.nextCursor).toBe("2");
    });

    it("only applies the sinceClearedAt filter when provided", async () => {
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);
      const since = new Date("2026-01-01T00:00:00.000Z");

      await getConversationMessagesPage("c1", undefined, 30, since);

      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { conversationId: "c1", createdAt: { gt: since } } }),
      );
    });
  });

  it("countUnreadMessages excludes the reader's own messages and deleted ones", async () => {
    await countUnreadMessages("c1", "user-1", null);
    expect(prisma.message.count).toHaveBeenCalledWith({
      where: { conversationId: "c1", senderId: { not: "user-1" }, deleted: false },
    });
  });

  describe("getConversationMediaPage", () => {
    it("returns an empty page when there's no anchor message", async () => {
      vi.mocked(prisma.message.findFirst).mockResolvedValue(null);
      const page = await getConversationMediaPage("c1");
      expect(page).toEqual({ items: [], nextCursor: null, hasMore: false });
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    });

    it("flattens each message's imageUrls into individual media items scoped to the anchor's month", async () => {
      vi.mocked(prisma.message.findFirst).mockResolvedValue({
        createdAt: new Date("2026-03-15T00:00:00.000Z"),
      } as never);
      vi.mocked(prisma.message.findMany).mockResolvedValue([
        { id: "m1", imageUrls: ["a.jpg", "b.jpg"], createdAt: new Date("2026-03-10T00:00:00.000Z") },
      ] as never);
      vi.mocked(prisma.message.count).mockResolvedValue(0);

      const page = await getConversationMediaPage("c1");

      expect(page.items).toEqual([
        { url: "a.jpg", messageId: "m1", createdAt: "2026-03-10T00:00:00.000Z" },
        { url: "b.jpg", messageId: "m1", createdAt: "2026-03-10T00:00:00.000Z" },
      ]);
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: new Date("2026-03-01T00:00:00.000Z"), lt: new Date("2026-04-01T00:00:00.000Z") },
          }),
        }),
      );
    });

    it("reports hasMore when older media exists before this month", async () => {
      vi.mocked(prisma.message.findFirst).mockResolvedValue({ createdAt: new Date("2026-03-15T00:00:00.000Z") } as never);
      vi.mocked(prisma.message.findMany).mockResolvedValue([]);
      vi.mocked(prisma.message.count).mockResolvedValue(5);

      const page = await getConversationMediaPage("c1");

      expect(page.hasMore).toBe(true);
      expect(page.nextCursor).toBe(new Date("2026-03-01T00:00:00.000Z").toISOString());
    });
  });

  it("getConversationFilesPage falls back to groupMessageId when messageId is null", async () => {
    vi.mocked(prisma.attachment.findFirst).mockResolvedValue({ createdAt: new Date("2026-03-15T00:00:00.000Z") } as never);
    vi.mocked(prisma.attachment.findMany).mockResolvedValue([
      {
        id: "att-1",
        fileUrl: "url",
        fileName: "a.pdf",
        fileSize: 10,
        mimeType: "application/pdf",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        messageId: null,
        groupMessageId: "gm-1",
      },
    ] as never);
    vi.mocked(prisma.attachment.count).mockResolvedValue(0);

    const page = await getConversationFilesPage("c1");

    expect(page.items[0]?.messageId).toBe("gm-1");
  });
});
